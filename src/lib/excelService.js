import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { matchTechnologyCourse } from './formParser';
import { COURSE_OPTIONS } from './mockData';
import { convertToGoogleDriveDirectImageUrl, isGoogleDriveUrl } from './driveHelper';

// Generate an official unique School ID: e.g. 2025-00105
function generateSmartSchoolId(existingStudents = [], indexOffset = 0) {
  const year = new Date().getFullYear();
  const count = (existingStudents?.length || 0) + 1 + indexOffset;
  const padded = String(count).padStart(5, '0');
  let candidate = `${year}-${padded}`;

  const existingIds = new Set(existingStudents?.map(s => s.school_id) || []);
  if (existingIds.has(candidate)) {
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    candidate = `${year}-${randomSuffix}`;
  }
  return candidate;
}

// Clean string and strip whitespace
function cleanStr(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Extracts embedded images (e.g. 2x2 ID photos or form scans) from an Excel (.xlsx) file
 * @param {ArrayBuffer} arrayBuffer
 * @returns {Promise<Array<{fileName: string, mimeType: string, dataUrl: string, row?: number}>>}
 */
export async function extractEmbeddedImagesFromXlsx(arrayBuffer) {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const images = [];

    // Check for drawing relations (xl/drawings/_rels/drawing1.xml.rels)
    const relsMap = {};
    const relsFiles = zip.file(/xl\/drawings\/_rels\/.*\.rels/i);
    if (relsFiles && relsFiles.length > 0) {
      for (const relsFile of relsFiles) {
        try {
          const relsXml = await relsFile.async('text');
          const relMatches = relsXml.matchAll(/Id="([^"]+)"[^>]+Target="([^"]+)"/g);
          for (const m of relMatches) {
            const target = m[2].replace(/^..\//, 'xl/');
            relsMap[m[1]] = target;
          }
        } catch {}
      }
    }

    // Check for drawing anchors (xl/drawings/drawing1.xml) to map image to row
    const rowMap = {};
    const drawingFiles = zip.file(/xl\/drawings\/.*drawing.*\.xml/i);
    if (drawingFiles && drawingFiles.length > 0) {
      for (const drawingFile of drawingFiles) {
        try {
          const drawingXml = await drawingFile.async('text');
          const anchorMatches = drawingXml.matchAll(/(?:<xdr:from>|<from>)[^<]*(?:<xdr:row>|<row>)(\d+)(?:<\/xdr:row>|<\/row>)[\s\S]*?(?:r:embed="([^"]+)"|embed="([^"]+)")/g);
          for (const m of anchorMatches) {
            const rowIdx = parseInt(m[1], 10);
            const rId = m[2] || m[3];
            const mediaPath = relsMap[rId];
            if (mediaPath) {
              rowMap[mediaPath.toLowerCase()] = rowIdx;
            }
          }
        } catch {}
      }
    }

    // Extract media files from xl/media/
    const mediaFiles = zip.file(/xl\/media\/.*\.(png|jpe?g|webp|gif|bmp)/i);
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop().toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
        const base64 = await file.async('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        const mappedRow = rowMap[file.name.toLowerCase()];

        images.push({
          fileName: file.name,
          mimeType,
          dataUrl,
          row: mappedRow !== undefined ? mappedRow : undefined
        });
      }
    }

    return images;
  } catch (err) {
    console.warn("Could not extract embedded images from xlsx ZIP:", err);
    return [];
  }
}

/**
 * Parses an Excel (.xlsx, .xls, .csv) file into student objects
 * Extracts student records, resolves Google Drive links, and attaches any embedded photos
 */
export async function parseExcelStudentFile(fileInput, existingStudents = []) {
  let arrayBuffer;
  let fileName = 'Students.xlsx';

  if (fileInput instanceof File) {
    fileName = fileInput.name;
    arrayBuffer = await fileInput.arrayBuffer();
  } else if (fileInput instanceof Blob) {
    arrayBuffer = await fileInput.arrayBuffer();
  } else if (fileInput instanceof ArrayBuffer) {
    arrayBuffer = fileInput;
  } else {
    throw new Error('Unsupported file input for Excel parsing');
  }

  // 1. Extract any embedded images inside the Excel workbook
  let embeddedImages = [];
  try {
    embeddedImages = await extractEmbeddedImagesFromXlsx(arrayBuffer);
  } catch (imgErr) {
    console.warn("Embedded image scanning skipped:", imgErr);
  }

  // 2. Read workbook sheets
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('No worksheets found in this Excel file.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON with header rows
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (!rawRows || rawRows.length === 0) {
    throw new Error('The Excel sheet contains no data rows.');
  }

  const parsedStudents = [];

  rawRows.forEach((row, index) => {
    // Normalize row keys to lowercase without spaces or underscores
    const normalizedRow = {};
    for (const key of Object.keys(row)) {
      const cleanKey = key.toLowerCase().replace(/[\s_\.\-\/\#]/g, '');
      normalizedRow[cleanKey] = row[key];
    }

    // School ID
    let schoolId = 
      cleanStr(normalizedRow['schoolid']) ||
      cleanStr(normalizedRow['studentid']) ||
      cleanStr(normalizedRow['idnumber']) ||
      cleanStr(normalizedRow['idno']) ||
      cleanStr(normalizedRow['studentno']) ||
      cleanStr(normalizedRow['id']) ||
      cleanStr(normalizedRow['lrn']);

    // First Name
    let firstName = 
      cleanStr(normalizedRow['firstname']) ||
      cleanStr(normalizedRow['first']) ||
      cleanStr(normalizedRow['givenname']) ||
      cleanStr(normalizedRow['fname']);

    // Middle Name
    let middleName = 
      cleanStr(normalizedRow['middlename']) ||
      cleanStr(normalizedRow['middle']) ||
      cleanStr(normalizedRow['mi']) ||
      cleanStr(normalizedRow['mname']);

    // Last Name
    let lastName = 
      cleanStr(normalizedRow['lastname']) ||
      cleanStr(normalizedRow['last']) ||
      cleanStr(normalizedRow['surname']) ||
      cleanStr(normalizedRow['familyname']) ||
      cleanStr(normalizedRow['lname']);

    // Full name fallback
    const combinedName = 
      cleanStr(normalizedRow['name']) || 
      cleanStr(normalizedRow['studentname']) || 
      cleanStr(normalizedRow['fullname']);

    if ((!firstName || !lastName) && combinedName) {
      if (combinedName.includes(',')) {
        const parts = combinedName.split(',').map(p => p.trim());
        lastName = parts[0] || '';
        if (parts[1]) {
          const firstAndMiddle = parts[1].split(/\s+/);
          firstName = firstAndMiddle[0] || '';
          if (firstAndMiddle.length > 1) {
            middleName = firstAndMiddle.slice(1).join(' ');
          }
        }
      } else {
        const nameParts = combinedName.split(/\s+/);
        if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = 'Student';
        } else if (nameParts.length === 2) {
          firstName = nameParts[0];
          lastName = nameParts[1];
        } else {
          firstName = nameParts[0];
          middleName = nameParts.slice(1, -1).join(' ');
          lastName = nameParts[nameParts.length - 1];
        }
      }
    }

    // Skip empty row if no name is available
    if (!firstName && !lastName) {
      return;
    }

    // Technology Course / Strand
    const rawCourse = 
      cleanStr(normalizedRow['course']) ||
      cleanStr(normalizedRow['coursestrand']) ||
      cleanStr(normalizedRow['technologycourse']) ||
      cleanStr(normalizedRow['techcourse']) ||
      cleanStr(normalizedRow['strand']) ||
      cleanStr(normalizedRow['program']) ||
      cleanStr(normalizedRow['track']);

    const courseStrand = matchTechnologyCourse(rawCourse);

    // Emergency Contacts
    const emergencyContactName = 
      cleanStr(normalizedRow['emergencycontactname']) ||
      cleanStr(normalizedRow['emergencycontact']) ||
      cleanStr(normalizedRow['parentname']) ||
      cleanStr(normalizedRow['guardian']) ||
      cleanStr(normalizedRow['parent']) ||
      cleanStr(normalizedRow['contactperson']);

    const emergencyContactPhone = 
      cleanStr(normalizedRow['emergencycontactphone']) ||
      cleanStr(normalizedRow['emergencyphone']) ||
      cleanStr(normalizedRow['contactnumber']) ||
      cleanStr(normalizedRow['contactno']) ||
      cleanStr(normalizedRow['parentphone']) ||
      cleanStr(normalizedRow['phone']) ||
      cleanStr(normalizedRow['mobile']) ||
      cleanStr(normalizedRow['cellphone']);

    // RFID UID
    const rfidUid = 
      cleanStr(normalizedRow['rfiduid']) ||
      cleanStr(normalizedRow['rfid']) ||
      cleanStr(normalizedRow['uid']) ||
      cleanStr(normalizedRow['carduid']);

    // Status
    const rawStatus = cleanStr(normalizedRow['status']).toUpperCase();
    const status = (rawStatus === 'INACTIVE' || rawStatus === 'SUSPENDED') ? rawStatus : 'ACTIVE';

    // Auto-generate School ID if row was missing one
    if (!schoolId) {
      schoolId = generateSmartSchoolId(existingStudents, index);
    }

    // Photo URL (with Google Drive link resolution & embedded image matching)
    let photoUrl = 
      cleanStr(normalizedRow['photourl']) || 
      cleanStr(normalizedRow['photo']) || 
      cleanStr(normalizedRow['image']) ||
      cleanStr(normalizedRow['picture']) ||
      cleanStr(normalizedRow['gdrive']) ||
      cleanStr(normalizedRow['googledrive']) ||
      cleanStr(normalizedRow['2x2']) ||
      cleanStr(normalizedRow['idphoto']) ||
      '';

    // If photoUrl is a Google Drive link, automatically convert to direct CDN image URL
    if (photoUrl && isGoogleDriveUrl(photoUrl)) {
      photoUrl = convertToGoogleDriveDirectImageUrl(photoUrl, 800);
    }

    // If row had no photo URL, check if there is an embedded image mapped to this row in the Excel sheet
    if (!photoUrl && embeddedImages.length > 0) {
      // Check 1: Image anchored to this row index (1-based or 0-based)
      const mappedImg = embeddedImages.find(img => img.row === (index + 1) || img.row === index);
      if (mappedImg) {
        photoUrl = mappedImg.dataUrl;
      } else if (embeddedImages[index]) {
        // Check 2: Sequential match (e.g. 1st image corresponds to 1st student)
        photoUrl = embeddedImages[index].dataUrl;
      }
    }

    parsedStudents.push({
      school_id: schoolId,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      course_strand: courseStrand,
      grade_level: cleanStr(normalizedRow['gradelevel']) || cleanStr(normalizedRow['grade']) || 'N/A',
      section: cleanStr(normalizedRow['section']) || 'N/A',
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      rfid_uid: rfidUid || null,
      blood_type: cleanStr(normalizedRow['bloodtype']) || 'O+',
      status: status,
      photo_url: photoUrl
    });
  });

  return {
    students: parsedStudents,
    totalRows: rawRows.length,
    fileName,
    sheetNames: workbook.SheetNames,
    embeddedImages
  };
}

/**
 * Creates and downloads a sample Excel template for student registration masterlist
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'School ID': '2025-00101',
      'First Name': 'Juan',
      'Middle Name': 'Bautista',
      'Last Name': 'Dela Cruz',
      'Course / Strand': 'Computer Engineering Technology (NC II)',
      'Emergency Contact Name': 'Maria Dela Cruz (Mother)',
      'Emergency Contact Phone': '+63 917 123 4567',
      'Photo URL / Google Drive Link': 'https://drive.google.com/file/d/1sample_gdrive_id/view',
      'RFID UID': '',
      'Status': 'ACTIVE'
    },
    {
      'School ID': '2025-00102',
      'First Name': 'Maria Santos',
      'Middle Name': 'Reyes',
      'Last Name': 'Aquino',
      'Course / Strand': 'Hospitality Technology (NC II)',
      'Emergency Contact Name': 'Jose Aquino (Father)',
      'Emergency Contact Phone': '+63 918 234 5678',
      'Photo URL / Google Drive Link': '',
      'RFID UID': '',
      'Status': 'ACTIVE'
    },
    {
      'School ID': '2025-00103',
      'First Name': 'Carlos',
      'Middle Name': 'Perez',
      'Last Name': 'Alcantara',
      'Course / Strand': 'Culinary Arts Technology (NC II)',
      'Emergency Contact Name': 'Elena Alcantara',
      'Emergency Contact Phone': '+63 920 345 6789',
      'Photo URL / Google Drive Link': '',
      'RFID UID': '',
      'Status': 'ACTIVE'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // School ID
    { wch: 18 }, // First Name
    { wch: 15 }, // Middle Name
    { wch: 18 }, // Last Name
    { wch: 38 }, // Course
    { wch: 28 }, // Emergency Contact
    { wch: 22 }, // Emergency Phone
    { wch: 45 }, // Photo URL / Google Drive Link
    { wch: 15 }, // RFID UID
    { wch: 10 }  // Status
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Masterlist');

  XLSX.writeFile(workbook, 'KM100_Student_Import_Template.xlsx');
}

/**
 * Exports current student directory to Excel (.xlsx) file
 */
export function exportStudentsToExcel(students = [], fileName = 'KM100_Students_Directory.xlsx') {
  if (!students || students.length === 0) {
    alert('No student records available to export.');
    return;
  }

  const exportData = students.map((s, index) => ({
    'No.': index + 1,
    'School ID': s.school_id || '',
    'Full Name': `${s.last_name || ''}, ${s.first_name || ''} ${s.middle_name || ''}`.trim(),
    'First Name': s.first_name || '',
    'Middle Name': s.middle_name || '',
    'Last Name': s.last_name || '',
    'Course / Strand': s.course_strand || '',
    'Emergency Contact': s.emergency_contact_name || '',
    'Emergency Phone': s.emergency_contact_phone || '',
    'Photo URL': s.photo_url || '',
    'RFID UID': s.rfid_uid || '',
    'Status': s.status || 'ACTIVE',
    'Date Registered': s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 15 },
    { wch: 30 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 36 },
    { wch: 26 },
    { wch: 20 },
    { wch: 40 },
    { wch: 14 },
    { wch: 10 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KM100_Students');

  XLSX.writeFile(workbook, fileName);
}
