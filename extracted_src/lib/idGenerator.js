/**
 * Smart School ID and RFID UID Generators for KM100 Skills & Training Center, Inc.
 * Generates unique, official IDs that strictly conform to PostgreSQL VARCHAR limits and turnstile scanner formats.
 */

/**
 * Validates whether a string is a clean, valid School ID (not a URL, path, or long text)
 */
export function isValidSchoolId(candidate) {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (trimmed.length === 0 || trimmed.length > 30) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  if (trimmed.includes('drive.google') || trimmed.includes('open?id=')) return false;
  if (trimmed.includes('/') || trimmed.includes('\\')) return false;
  return true;
}

/**
 * Automatically creates a unique KM100 School ID: e.g. 2026-00001
 */
export function generateSmartSchoolId(existingStudents = [], offset = 0) {
  const year = new Date().getFullYear();
  const existingIds = new Set(
    (existingStudents || [])
      .map(s => s && (typeof s === 'object' ? s.school_id : s))
      .filter(id => id && typeof id === 'string')
      .map(id => id.trim().toLowerCase())
  );

  let count = (existingStudents?.length || 0) + 1 + offset;
  let candidate = `${year}-${String(count).padStart(5, '0')}`;

  while (existingIds.has(candidate.toLowerCase())) {
    count++;
    candidate = `${year}-${String(count).padStart(5, '0')}`;
  }

  return candidate;
}

/**
 * Automatically creates a unique RFID UID: e.g. RFID-2026-00001
 */
export function generateSmartRfidUid(existingStudents = [], offset = 0) {
  const year = new Date().getFullYear();
  const existingRfids = new Set(
    (existingStudents || [])
      .map(s => s && (typeof s === 'object' ? s.rfid_uid : s))
      .filter(rfid => rfid && typeof rfid === 'string')
      .map(rfid => rfid.trim().toLowerCase())
  );

  let count = (existingStudents?.length || 0) + 1 + offset;
  let candidate = `RFID-${year}-${String(count).padStart(5, '0')}`;

  while (existingRfids.has(candidate.toLowerCase())) {
    count++;
    candidate = `RFID-${year}-${String(count).padStart(5, '0')}`;
  }

  return candidate;
}
