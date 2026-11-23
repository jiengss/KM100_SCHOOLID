import * as XLSX from 'xlsx';
import { matchTechnologyCourse } from './formParser';
import { COURSE_OPTIONS } from './mockData';

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
 * Parses an Excel (.xlsx, .xls, .csv) file into student objects
 * @param {File|Blob|ArrayBuffer} fileInput
 * @param {Array} existingStudents
 * @returns {Promise<{students: Array, totalRows: number, fileName: string}>}
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

  // Read workbook
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('No worksheets found in this Excel file.');
  }

  // Read first sheet
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

    // 1. School ID
    let schoolId = 
      cleanStr(normalizedRow['schoolid']) ||
      cleanStr(normalizedRow['studentid']) ||
      cleanStr(normalizedRow['idnumber']) ||
      cleanStr(normalizedRow['idno']) ||
      cleanStr(normalizedRow['studentno']) ||
      cleanStr(normalizedRow['id']) ||
      cleanStr(normalizedRow['lrn']);

    // 2. First Name
    let firstName = 
      cleanStr(normalizedRow['firstname']) ||
      cleanStr(normalizedRow['first']) ||
      cleanStr(normalizedRow['givenname']) ||
      cleanStr(normalizedRow['fname']);

    // 3. Middle Name
    let middleName = 
      cleanStr(normalizedRow['middlename']) ||
      cleanStr(normalizedRow['middle']) ||
      cleanStr(normalizedRow['mi']) ||
      cleanStr(normalizedRow['mname']);

    // 4. Last Name
    let lastName = 
      cleanStr(normalizedRow['lastname']) ||
      cleanStr(normalizedRow['last']) ||
      cleanStr(normalizedRow['surname']) ||
      cleanStr(normalizedRow['familyname']) ||
      cleanStr(normalizedRow['lname']);

    // Fallback: If "Name" or "Student Name" was a single combined column (e.g. "Dela Cruz, Juan B.")
    const combinedName = 
      cleanStr(normalizedRow['name']) || 
      cleanStr(normalizedRow['studentname']) || 
      cleanStr(normalizedRow['fullname']);

    if ((!firstName || !lastName) && combinedName) {
      if (combinedName.includes(',')) {
        // "Lastname, Firstname Middlename"
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
        // "Firstname Middlename Lastname"
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

    // 5. Technology Course / Strand
    const rawCourse = 
      cleanStr(normalizedRow['course']) ||
      cleanStr(normalizedRow['coursestrand']) ||
      cleanStr(normalizedRow['technologycourse']) ||
      cleanStr(normalizedRow['techcourse']) ||
      cleanStr(normalizedRow['strand']) ||
      cleanStr(normalizedRow['program']) ||
      cleanStr(normalizedRow['track']);

    const courseStrand = matchTechnologyCourse(rawCourse);

    // 6. Emergency Contact Person
    const emergencyContactName = 
      cleanStr(normalizedRow['emergencycontactname']) ||
      cleanStr(normalizedRow['emergencycontact']) ||
      cleanStr(normalizedRow['parentname']) ||
      cleanStr(normalizedRow['guardian']) ||
      cleanStr(normalizedRow['parent']) ||
      cleanStr(normalizedRow['contactperson']);

    // 7. Emergency Contact Phone
    const emergencyContactPhone = 
      cleanStr(normalizedRow['emergencycontactphone']) ||
      cleanStr(normalizedRow['emergencyphone']) ||
      cleanStr(normalizedRow['contactnumber']) ||
      cleanStr(normalizedRow['contactno']) ||
      cleanStr(normalizedRow['parentphone']) ||
      cleanStr(normalizedRow['phone']) ||
      cleanStr(normalizedRow['mobile']) ||
      cleanStr(normalizedRow['cellphone']);

    // 8. RFID UID
    const rfidUid = 
      cleanStr(normalizedRow['rfiduid']) ||
      cleanStr(normalizedRow['rfid']) ||
      cleanStr(normalizedRow['uid']) ||
      cleanStr(normalizedRow['carduid']);

    // 9. Status
    const rawStatus = cleanStr(normalizedRow['status']).toUpperCase();
    const status = (rawStatus === 'INACTIVE' || rawStatus === 'SUSPENDED') ? rawStatus : 'ACTIVE';

    // Auto-generate School ID if row was missing one
    if (!schoolId) {
      schoolId = generateSmartSchoolId(existingStudents, index);
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
      photo_url: cleanStr(normalizedRow['photourl']) || cleanStr(normalizedRow['photo']) || ''
    });
  });

  return {
    students: parsedStudents,
    totalRows: rawRows.length,
    fileName,
    sheetNames: workbook.SheetNames
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
      'RFID UID': '',
      'Status': 'ACTIVE'
    },
    {
      'School ID': '2025-00104',
      'First Name': 'Angela',
      'Middle Name': 'Cruz',
      'Last Name': 'Mendoza',
      'Course / Strand': 'Electronics Engineering Technology (NC II)',
      'Emergency Contact Name': 'Roberto Mendoza',
      'Emergency Contact Phone': '+63 927 456 7890',
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
    { wch: 14 },
    { wch: 10 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'KM100_Students');

  XLSX.writeFile(workbook, fileName);
}
