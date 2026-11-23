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

// Convert string to Title Case (e.g. "JUAN DELA CRUZ" -> "Juan Dela Cruz")
export function toTitleCase(str) {
  if (!str) return '';
  // Check if string is already mixed case
  if (/[a-z]/.test(str) && /[A-Z]/.test(str) && !/^[A-Z\s,.-]+$/.test(str)) {
    return str.trim();
  }
  return str
    .toLowerCase()
    .split(/[\s]+/)
    .map(word => {
      if (['ii', 'iii', 'iv', 'nc', 'rfid'].includes(word.toLowerCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .trim();
}

// Clean phone numbers from Excel numbers (e.g. 9171234567 -> 09171234567)
export function formatExcelPhoneNumber(rawPhone) {
  if (!rawPhone) return '';
  let str = String(rawPhone).trim();
  // Remove decimals if Excel read as float (e.g. 9171234567.0)
  str = str.replace(/\.0+$/, '');
  
  // If it's a 10-digit Philippine mobile starting with 9 (e.g. 9171234567)
  if (/^9\d{9}$/.test(str)) {
    return '0' + str;
  }
  // If already 11-digit starting with 09
  if (/^09\d{9}$/.test(str)) {
    return str;
  }
  // If starting with 639...
  if (/^639\d{9}$/.test(str)) {
    return '+' + str;
  }
  return str;
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
 * Finds the actual header row in a spreadsheet 2D array by scanning for student table keywords
 */
export function detectHeaderRowIndex(rows2D) {
  if (!rows2D || rows2D.length === 0) return 0;

  const headerKeywords = [
    'first name', 'firstname', 'last name', 'lastname', 'surname', 'student name', 'name',
    'school id', 'student id', 'id number', 'id no', 'lrn', 'student no', 'id',
    'course', 'strand', 'program', 'technology', 'tech',
    'emergency', 'contact', 'phone', 'mobile', 'guardian', 'parent',
    'photo', 'image', 'rfid', 'gender', 'sex', 'section', 'grade'
  ];

  let bestRowIndex = 0;
  let maxScore = 0;

  // Scan up to first 20 rows
  const scanLimit = Math.min(20, rows2D.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rows2D[r];
    if (!Array.isArray(row)) continue;

    let score = 0;
    for (const cell of row) {
      const cellStr = cleanStr(cell).toLowerCase();
      if (!cellStr) continue;

      for (const kw of headerKeywords) {
        if (cellStr === kw || cellStr.includes(kw)) {
          score += (cellStr === kw ? 3 : 1);
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestRowIndex = r;
    }
  }

  // If no good header row was found (e.g. score < 2), default to 0
  return maxScore >= 2 ? bestRowIndex : 0;
}

/**
 * Accurately parses an Excel (.xlsx, .xls, .csv) file into student objects
 * Accurately detects title rows, extracts exact file columns, maps Google Drive images and embedded photos
 */
export async function parseExcelStudentFile(fileInput, existingStudents = [], targetSheetName = null) {
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

  // 1. Extract embedded images from zip media
  let embeddedImages = [];
  try {
    embeddedImages = await extractEmbeddedImagesFromXlsx(arrayBuffer);
  } catch (imgErr) {
    console.warn("Embedded image scanning skipped:", imgErr);
  }

  // 2. Read workbook
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('No worksheets found in this Excel file.');
  }

  const selectedSheetName = targetSheetName && workbook.SheetNames.includes(targetSheetName)
    ? targetSheetName
    : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[selectedSheetName];

  // 3. Convert to 2D array to detect real header row (ignoring school title blocks)
  const rows2D = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
  if (!rows2D || rows2D.length === 0) {
    throw new Error('The selected Excel sheet contains no data.');
  }

  const headerRowIdx = detectHeaderRowIndex(rows2D);
  const rawHeaderRow = (rows2D[headerRowIdx] || []).map((h, i) => cleanStr(h) || `Column_${i + 1}`);
  
  // Data rows are everything after headerRowIdx
  const rawDataRows = rows2D.slice(headerRowIdx + 1);

  // Build clean column map (normalized name -> column index)
  const colIndexMap = {};
  rawHeaderRow.forEach((h, colIdx) => {
    const cleanH = h.toLowerCase().replace(/[\s_\.\-\/\#\(\)]/g, '');
    colIndexMap[cleanH] = colIdx;
  });

  const parsedStudents = [];
  const rawDisplayRows = [];

  rawDataRows.forEach((rowArray, rowIndex) => {
    if (!Array.isArray(rowArray) || rowArray.every(c => cleanStr(c) === '')) {
      return; // Skip empty rows
    }

    // Helper to get value by fuzzy column keys
    const getVal = (...keys) => {
      for (const k of keys) {
        const cleanK = k.toLowerCase().replace(/[\s_\.\-\/\#\(\)]/g, '');
        // Exact normalized match
        if (colIndexMap[cleanK] !== undefined) {
          const val = rowArray[colIndexMap[cleanK]];
          if (val !== undefined && val !== null && cleanStr(val) !== '') {
            return cleanStr(val);
          }
        }
        // Substring match
        for (const [colName, colIdx] of Object.entries(colIndexMap)) {
          if (colName.includes(cleanK) || cleanK.includes(colName)) {
            const val = rowArray[colIdx];
            if (val !== undefined && val !== null && cleanStr(val) !== '') {
              return cleanStr(val);
            }
          }
        }
      }
      return '';
    };

    // 1. School ID
    let schoolId = getVal('schoolid', 'studentid', 'idnumber', 'idno', 'studentno', 'lrn', 'id');

    // 2. Names
    let firstName = getVal('firstname', 'first', 'givenname', 'fname');
    let middleName = getVal('middlename', 'middle', 'mi', 'mname');
    let lastName = getVal('lastname', 'last', 'surname', 'familyname', 'lname');

    // Full name column fallback (e.g. "Dela Cruz, Juan Bautista" or "Juan Dela Cruz")
    const combinedName = getVal('name', 'studentname', 'fullname', 'student');
    if ((!firstName || !lastName) && combinedName) {
      if (combinedName.includes(',')) {
        // "DELA CRUZ, JUAN BAUTISTA"
        const parts = combinedName.split(',').map(p => cleanStr(p));
        lastName = toTitleCase(parts[0]);
        if (parts[1]) {
          const nameTokens = parts[1].split(/\s+/).filter(Boolean);
          firstName = toTitleCase(nameTokens[0] || '');
          if (nameTokens.length > 1) {
            middleName = toTitleCase(nameTokens.slice(1).join(' '));
          }
        }
      } else {
        // "Juan Bautista Dela Cruz"
        const tokens = combinedName.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) {
          firstName = toTitleCase(tokens[0]);
          lastName = 'Student';
        } else if (tokens.length === 2) {
          firstName = toTitleCase(tokens[0]);
          lastName = toTitleCase(tokens[1]);
        } else {
          firstName = toTitleCase(tokens[0]);
          middleName = toTitleCase(tokens.slice(1, -1).join(' '));
          lastName = toTitleCase(tokens[tokens.length - 1]);
        }
      }
    } else {
      firstName = toTitleCase(firstName);
      middleName = toTitleCase(middleName);
      lastName = toTitleCase(lastName);
    }

    // Skip row if no student name could be found
    if (!firstName && !lastName) {
      return;
    }

    // 3. Course / Program
    const rawCourse = getVal('course', 'coursestrand', 'technologycourse', 'techcourse', 'strand', 'program', 'track', 'specialization');
    const matchedCourse = matchTechnologyCourse(rawCourse);

    // 4. Emergency Contacts
    const emergencyContactName = toTitleCase(getVal('emergencycontactname', 'emergencycontact', 'parentname', 'guardian', 'parent', 'contactperson', 'emergency'));
    const emergencyContactPhone = formatExcelPhoneNumber(getVal('emergencycontactphone', 'emergencyphone', 'contactnumber', 'contactno', 'parentphone', 'phone', 'mobile', 'cellphone'));

    // 5. RFID UID
    const rfidUid = getVal('rfiduid', 'rfid', 'uid', 'carduid');

    // 6. Grade / Section / Gender / Blood Type
    const gradeLevel = getVal('gradelevel', 'grade', 'yearlevel', 'year') || 'N/A';
    const section = getVal('section', 'class', 'batch') || 'N/A';
    const gender = getVal('gender', 'sex') || 'Unspecified';
    const bloodType = getVal('bloodtype', 'blood') || 'O+';

    // 7. Status
    const rawStatus = getVal('status').toUpperCase();
    const status = (rawStatus === 'INACTIVE' || rawStatus === 'SUSPENDED') ? rawStatus : 'ACTIVE';

    // 8. Photo URL & Embedded Image Resolution
    let photoUrl = getVal('photourl', 'photo', 'image', 'picture', 'gdrive', 'googledrive', '2x2', 'idphoto');
    let photoSourceType = 'none';

    // If it's a Google Drive link, convert to direct high-res CDN link
    if (photoUrl && isGoogleDriveUrl(photoUrl)) {
      photoUrl = convertToGoogleDriveDirectImageUrl(photoUrl, 800);
      photoSourceType = 'gdrive';
    } else if (photoUrl) {
      photoSourceType = 'url';
    }

    // If no photo URL was in the column, check for embedded images in this row
    if (!photoUrl && embeddedImages.length > 0) {
      const actualRowNumber = headerRowIdx + 1 + rowIndex;
      // Match by Excel row index (anchor row)
      const mappedImg = embeddedImages.find(img => img.row === actualRowNumber || img.row === (actualRowNumber - 1));
      if (mappedImg) {
        photoUrl = mappedImg.dataUrl;
        photoSourceType = 'excel_embedded';
      } else if (embeddedImages[rowIndex]) {
        photoUrl = embeddedImages[rowIndex].dataUrl;
        photoSourceType = 'excel_embedded';
      }
    }

    // Auto-generate School ID if empty
    const isIdAutoGenerated = !schoolId;
    if (!schoolId) {
      schoolId = generateSmartSchoolId(existingStudents, rowIndex);
    }

    // Construct full row object for display
    const rawRowObj = {};
    rawHeaderRow.forEach((h, cIdx) => {
      rawRowObj[h] = rowArray[cIdx] !== undefined ? cleanStr(rowArray[cIdx]) : '';
    });

    const parsedStudent = {
      row_index: rowIndex + 1,
      school_id: schoolId,
      is_id_generated: isIdAutoGenerated,
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      raw_course: rawCourse,
      course_strand: matchedCourse,
      grade_level: gradeLevel,
      section: section,
      gender: gender,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      rfid_uid: rfidUid || null,
      blood_type: bloodType,
      status: status,
      photo_url: photoUrl,
      photo_source_type: photoSourceType,
      raw_data: rawRowObj
    };

    parsedStudents.push(parsedStudent);
    rawDisplayRows.push(rawRowObj);
  });

  return {
    students: parsedStudents,
    rawHeaders: rawHeaderRow,
    rawRows: rawDisplayRows,
    totalRows: rawDataRows.length,
    fileName,
    selectedSheetName,
    sheetNames: workbook.SheetNames,
    embeddedImages,
    headerRowIndex: headerRowIdx + 1
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

  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 38 },
    { wch: 28 },
    { wch: 22 },
    { wch: 45 },
    { wch: 15 },
    { wch: 10 }
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
