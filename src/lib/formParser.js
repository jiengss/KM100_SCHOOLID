import { COURSE_OPTIONS } from './mockData';

/**
 * Matches raw course text against official KM100 NC II course offerings
 */
export function matchTechnologyCourse(rawText) {
  if (!rawText) return COURSE_OPTIONS[0];
  const text = rawText.toLowerCase().trim();

  if (text.includes('computer') || text.includes('cet') || text.includes('programming') || text.includes('software')) {
    return 'Computer Engineering Technology (NC II)';
  }
  if (text.includes('hospitality') || text.includes('hotel') || text.includes('ht-') || text.includes('hrm')) {
    return 'Hospitality Technology (NC II)';
  }
  if (text.includes('electronics') || text.includes('ecet') || text.includes('circuits')) {
    return 'Electronics Engineering Technology (NC II)';
  }
  if (text.includes('electrical') || text.includes('eet') || text.includes('electric')) {
    return 'Electrical Engineering Technology (NC II)';
  }
  if (text.includes('tourism') || text.includes('tt-') || text.includes('tourist') || text.includes('travel')) {
    return 'Tourism Technology (NC II)';
  }
  if (text.includes('culinary') || text.includes('cat-') || text.includes('cook') || text.includes('chef')) {
    return 'Culinary Arts Technology (NC II)';
  }
  if (text.includes('restaurant') || text.includes('rot-') || text.includes('dining') || text.includes('f&b')) {
    return 'Restaurant Operations Technology (NC II)';
  }

  // Exact or closest substring match against COURSE_OPTIONS
  const matched = COURSE_OPTIONS.find(c => c.toLowerCase().includes(text) || text.includes(c.toLowerCase()));
  return matched || COURSE_OPTIONS[0];
}

/**
 * Cleans extracted field values (stripping colons, quotes, trailing garbage)
 */
function cleanVal(str) {
  if (!str) return '';
  return str
    .replace(/^[:=\-\s]+/, '')
    .replace(/[;\r\n]+$/, '')
    .trim();
}

/**
 * Extracts student registration information from raw text, OCR output, or QR data
 */
export function parseRegistrationFormText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      school_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      course_strand: COURSE_OPTIONS[0],
      emergency_contact_name: '',
      emergency_contact_phone: '',
      raw_text: ''
    };
  }

  const text = rawText.trim();
  const result = {
    school_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    course_strand: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    raw_text: text
  };

  // 1. Try parsing as JSON first (common in QR codes generated from online forms)
  try {
    const json = JSON.parse(text);
    if (typeof json === 'object' && json !== null) {
      result.school_id = json.school_id || json.schoolId || json.student_id || json.studentId || json.id || '';
      result.first_name = json.first_name || json.firstName || json.fn || '';
      result.middle_name = json.middle_name || json.middleName || json.mn || json.mi || '';
      result.last_name = json.last_name || json.lastName || json.ln || '';
      result.course_strand = matchTechnologyCourse(json.course_strand || json.course || json.technology_course || json.strand);
      result.emergency_contact_name = json.emergency_contact_name || json.emergencyContact || json.guardian || json.parent || '';
      result.emergency_contact_phone = json.emergency_contact_phone || json.emergencyPhone || json.contactNumber || json.phone || '';
      
      if (result.first_name || result.last_name || result.school_id) {
        return result;
      }
    }
  } catch {
    // Not JSON, continue to pattern-based extraction
  }

  // 2. Line-by-line and Regex-based field extraction for paper form OCR
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // School ID / Student ID
  const idMatch = text.match(/(?:school\s*id|student\s*id|id\s*(?:number|no\.?)|student\s*(?:number|no\.?))\s*[:=\-]\s*([A-Za-z0-9\-]+)/i);
  if (idMatch) {
    result.school_id = cleanVal(idMatch[1]);
  } else {
    // Fallback: look for 202X-XXXXX style ID format
    const yearIdMatch = text.match(/\b(202[0-9]-[0-9A-Za-z]{3,7})\b/);
    if (yearIdMatch) {
      result.school_id = cleanVal(yearIdMatch[1]);
    }
  }

  // First Name
  const fnMatch = text.match(/(?:first\s*name|given\s*name|firstname|fn)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (fnMatch) result.first_name = cleanVal(fnMatch[1]);

  // Middle Name
  const mnMatch = text.match(/(?:middle\s*name|middlename|middle\s*initial|m\.?i\.?|mn)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (mnMatch) result.middle_name = cleanVal(mnMatch[1]);

  // Last Name
  const lnMatch = text.match(/(?:last\s*name|lastname|surname|family\s*name|ln)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (lnMatch) result.last_name = cleanVal(lnMatch[1]);

  // Fallback if "Name: Last, First Middle" format was used
  if (!result.first_name && !result.last_name) {
    const combinedNameMatch = text.match(/(?:student\s*)?name\s*[:=\-]\s*([A-Za-z\s]+),\s*([A-Za-z\s]+)(?:\s+([A-Za-z\s]+))?/i);
    if (combinedNameMatch) {
      result.last_name = cleanVal(combinedNameMatch[1]);
      result.first_name = cleanVal(combinedNameMatch[2]);
      if (combinedNameMatch[3]) result.middle_name = cleanVal(combinedNameMatch[3]);
    }
  }

  // Technology Course
  const courseMatch = text.match(/(?:technology\s*course|tech\s*course|course(?:\s*strand)?|nc\s*ii\s*course|program)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (courseMatch) {
    result.course_strand = matchTechnologyCourse(courseMatch[1]);
  } else {
    // Check if any line directly matches a known NC II course keyword
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('technology') || lower.includes('nc ii') || lower.includes('engineering') || lower.includes('culinary') || lower.includes('tourism') || lower.includes('hospitality')) {
        result.course_strand = matchTechnologyCourse(line);
        break;
      }
    }
    if (!result.course_strand) {
      result.course_strand = COURSE_OPTIONS[0];
    }
  }

  // Emergency Contact Person
  const ecNameMatch = text.match(/(?:emergency\s*contact(?:\s*person)?|guardian(?:\s*name)?|parent(?:\s*name)?|in\s*case\s*of\s*emergency)\s*[:=\-]\s*([^\n\r,;|]+)/i);
  if (ecNameMatch) {
    result.emergency_contact_name = cleanVal(ecNameMatch[1]);
  }

  // Emergency Phone Number
  const ecPhoneMatch = text.match(/(?:emergency\s*(?:contact\s*)?(?:phone|number|mobile|tel)|parent\s*contact|contact\s*no\.?)\s*[:=\-]\s*([\+0-9\s\(\)\-]+)/i);
  if (ecPhoneMatch) {
    result.emergency_contact_phone = cleanVal(ecPhoneMatch[1]);
  } else {
    // Search for Philippine phone format (e.g. 0917-123-4567, +639171234567) or international phone format
    const phoneRegex = /(?:\+?63\s?9\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|09\d{2}[\s\-]?\d{3}[\s\-]?\d{4}|\+?1?\s?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/;
    const phoneFound = text.match(phoneRegex);
    if (phoneFound) {
      result.emergency_contact_phone = cleanVal(phoneFound[0]);
    }
  }

  return result;
}
