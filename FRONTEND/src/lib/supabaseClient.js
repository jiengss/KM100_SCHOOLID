// ==============================================================================
// KM100 SKILLS AND TRAINING CENTER, INC.
// Laravel Backend API Client (Laragon MySQL)
// Replaces external Supabase dependencies with direct Laravel REST API calls
// ==============================================================================

import { INITIAL_STUDENTS, INITIAL_LOGS } from './mockData';
import { generateSmartSchoolId, generateSmartRfidUid, isValidSchoolId } from './idGenerator';

const API_BASE = (import.meta.env?.VITE_API_URL || 'https://smokeless-unstitch-upward.ngrok-free.dev/api/v1').replace(/\/$/, '');

const AUTH_SESSION_KEY = 'km100_auth_user';
const LOCAL_STUDENTS_KEY = 'km100_local_students';
const LOCAL_LOGS_KEY = 'km100_local_attendance_logs';
const LOCAL_EMPLOYEES_KEY = 'km100_local_employees';

function getLocalEmployees() {
  try {
    const data = localStorage.getItem(LOCAL_EMPLOYEES_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalEmployees(employees) {
  try {
    localStorage.setItem(LOCAL_EMPLOYEES_KEY, JSON.stringify(employees || []));
  } catch {}
}

const MOCK_NAMES = ['sophia', 'alexander', 'isabella', 'marcus', 'chloe', 'gabriel', 'jasmine'];

export function isMockStudent(s) {
  if (!s) return false;
  const schoolId = (s.school_id || '').toLowerCase();
  const firstName = (s.first_name || '').toLowerCase();
  const lastName = (s.last_name || '').toLowerCase();
  return schoolId.startsWith('2024-1000') ||
         schoolId.startsWith('rfid-9910') ||
         (MOCK_NAMES.includes(firstName) && ['rodriguez', 'chen', 'santos', 'johnson', 'taylor', 'velasco', 'flores'].includes(lastName));
}

// Local cache helpers (for offline / instant rendering)
function getLocalStudents() {
  try {
    const data = localStorage.getItem(LOCAL_STUDENTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter(s => !isMockStudent(s)) : [];
  } catch {
    return [];
  }
}

function saveLocalStudents(students) {
  try {
    const cleaned = (students || []).filter(s => !isMockStudent(s));
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(cleaned));
  } catch {}
}

function getLocalLogs() {
  try {
    const data = localStorage.getItem(LOCAL_LOGS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter(l => l && l.school_id && !l.school_id.startsWith('2024-1000')) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs) {
  try {
    const cleaned = (logs || []).filter(l => l && l.school_id && !l.school_id.startsWith('2024-1000'));
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(cleaned));
  } catch {}
}

// HTTP request helper with JSON headers
async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {})
  };

  const isCrossOrigin = url.startsWith('http://') || url.startsWith('https://');
  const response = await fetch(url, {
    credentials: isCrossOrigin ? 'include' : 'same-origin',
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = (data && data.message) ? data.message : `Server Error: ${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Configuration compatibility functions
export function getStoredSupabaseConfig() {
  return { 
    url: window.location.origin + '/api', 
    anonKey: 'laravel-mysql-backend' 
  };
}

export function saveStoredSupabaseConfig() {
  // Maintained for backward compatibility
  return true;
}

export function getSupabase() {
  // Returns connected status for UI indicators
  return { connected: true };
}

export const dbService = {
  isConfigured() {
    return true; // Laravel & MySQL on Laragon is active and configured
  },

  async testConnection() {
    try {
      const result = await request('/health');
      return { 
        success: result.success, 
        message: result.message || 'Connected successfully to Laravel MySQL backend (Laragon)!' 
      };
    } catch (err) {
      return { 
        success: false, 
        message: err.message || 'Failed to connect to Laravel MySQL backend.' 
      };
    }
  },

  async purgeMockData() {
    try {
      // 1. Purge from local storage cache
      const localStudents = getLocalStudents().filter(s => !isMockStudent(s));
      saveLocalStudents(localStudents);
      const localLogs = getLocalLogs().filter(l => l && !l.school_id?.startsWith('2024-1000'));
      saveLocalLogs(localLogs);

      // 2. Purge from Laravel MySQL database
      await request('/students/purge-mock', { method: 'POST' });
    } catch (err) {
      console.warn('Notice during mock data purge:', err);
    }
  },

  async getStudents() {
    try {
      const data = await request('/students');
      if (Array.isArray(data)) {
        const cleaned = data.filter(s => !isMockStudent(s));
        saveLocalStudents(cleaned);
        return cleaned;
      }
    } catch (err) {
      console.warn('Backend fetch students failed, using cached local data:', err);
    }
    return getLocalStudents();
  },

  async findStudentByScan(scannedValue) {
    const trimmed = (scannedValue || '').trim();
    if (!trimmed) return null;

    try {
      const student = await request(`/students/scan/${encodeURIComponent(trimmed)}`);
      if (student && student.id) {
        return student;
      }
    } catch (err) {
      if (err.status !== 404) {
        console.warn('Backend findStudentByScan error, falling back to local cache:', err);
      }
    }

    // Local fallback search (case-insensitive)
    const local = getLocalStudents();
    return local.find(
      s => (s.school_id && s.school_id.toLowerCase() === trimmed.toLowerCase()) ||
           (s.rfid_uid && s.rfid_uid.toLowerCase() === trimmed.toLowerCase())
    ) || null;
  },

  async getLastAttendance(studentId) {
    if (!studentId) return null;
    try {
      const data = await request(`/attendance/last/${encodeURIComponent(studentId)}`);
      return data || null;
    } catch (err) {
      console.warn('Backend getLastAttendance failed, checking local cache:', err);
    }

    const logs = getLocalLogs();
    const studentLogs = logs.filter(l => l.student_id === studentId);
    return studentLogs[0] || null;
  },

  async recordAttendance({ person, student, employee, logType, gate = 'Main Gate Kiosk', remarks = 'Normal' }) {
    const isEmp = !!employee || (person && (person.person_type === 'EMPLOYEE' || !!person.role));
    const targetPerson = employee || student || person || {};
    const schoolId = targetPerson.school_id || targetPerson.employee_id || '';
    const timestamp = new Date().toISOString();

    const payload = {
      person_type: isEmp ? 'EMPLOYEE' : 'STUDENT',
      student_id: isEmp ? null : targetPerson.id,
      employee_id: isEmp ? targetPerson.id : null,
      school_id: schoolId,
      log_type: logType,
      timestamp,
      gate_station: gate,
      remarks
    };

    const fallbackEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...payload,
      student: isEmp ? null : targetPerson,
      employee: isEmp ? targetPerson : null
    };

    try {
      const saved = await request('/attendance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update local logs cache
      const currentLogs = getLocalLogs();
      const updated = [saved, ...currentLogs].slice(0, 500);
      saveLocalLogs(updated);

      return saved;
    } catch (err) {
      console.warn('Backend recordAttendance failed, saving locally:', err);
      const currentLogs = getLocalLogs();
      const updated = [fallbackEntry, ...currentLogs].slice(0, 500);
      saveLocalLogs(updated);
      return fallbackEntry;
    }
  },

  async getRecentLogs(limit = 50) {
    try {
      const data = await request(`/attendance?limit=${limit}`);
      if (Array.isArray(data)) {
        const cleaned = data.filter(l => l && l.school_id && !l.school_id.startsWith('2024-1000'));
        saveLocalLogs(cleaned);
        return cleaned;
      }
    } catch (err) {
      console.warn('Backend getRecentLogs failed, using local cache:', err);
    }
    return getLocalLogs().slice(0, limit);
  },

  async createStudent(rawStudentData) {
    const localList = getLocalStudents();

    // 1. Sanitize School ID
    let schoolId = rawStudentData.school_id?.trim() || '';
    let photoUrl = rawStudentData.photo_url?.trim() || null;

    if (schoolId.startsWith('http://') || schoolId.startsWith('https://') || schoolId.includes('drive.google') || schoolId.includes('open?id=')) {
      if (!photoUrl) {
        photoUrl = schoolId;
      }
      schoolId = '';
    }

    if (!isValidSchoolId(schoolId)) {
      schoolId = generateSmartSchoolId(localList);
    }

    // 2. Automatically create RFID UID if missing
    let rfidUid = rawStudentData.rfid_uid?.trim() || null;
    if (!rfidUid || rfidUid.length > 50) {
      rfidUid = generateSmartRfidUid(localList);
    }

    // 3. Names
    let firstName = rawStudentData.first_name?.trim() || '';
    let middleName = rawStudentData.middle_name?.trim() || null;
    let lastName = rawStudentData.last_name?.trim() || '';

    if (!firstName && middleName) {
      firstName = middleName;
      middleName = null;
    }

    const payload = {
      school_id: schoolId.slice(0, 50),
      rfid_uid: rfidUid ? rfidUid.slice(0, 50) : null,
      first_name: firstName.slice(0, 100),
      middle_name: middleName ? middleName.slice(0, 100) : null,
      last_name: lastName.slice(0, 100),
      gender: rawStudentData.gender || 'Unspecified',
      grade_level: (rawStudentData.grade_level || 'N/A').slice(0, 50),
      section: (rawStudentData.section || 'N/A').slice(0, 50),
      course_strand: rawStudentData.course_strand || 'Computer Engineering Technology (3 Year Diploma)',
      email: rawStudentData.email?.trim() || null,
      contact_number: rawStudentData.contact_number?.trim() || null,
      photo_url: photoUrl,
      emergency_contact_name: rawStudentData.emergency_contact_name?.trim() || null,
      emergency_contact_phone: rawStudentData.emergency_contact_phone?.trim() || null,
      blood_type: rawStudentData.blood_type || 'Unknown',
      status: rawStudentData.status || 'ACTIVE'
    };

    try {
      const created = await request('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update local cache
      const list = getLocalStudents();
      const filtered = list.filter(s => s.id !== created.id && s.school_id !== created.school_id);
      filtered.unshift(created);
      saveLocalStudents(filtered);

      return created;
    } catch (err) {
      console.error('Failed to create student on Laravel backend:', err);
      throw err;
    }
  },

  async updateStudent(id, rawStudentData) {
    const payload = {
      ...rawStudentData,
      school_id: rawStudentData.school_id?.trim() || '',
      rfid_uid: rawStudentData.rfid_uid?.trim() || null,
      first_name: rawStudentData.first_name?.trim() || '',
      middle_name: rawStudentData.middle_name?.trim() || null,
      last_name: rawStudentData.last_name?.trim() || '',
      email: rawStudentData.email?.trim() || null,
      contact_number: rawStudentData.contact_number?.trim() || null,
      photo_url: rawStudentData.photo_url?.trim() || null,
      emergency_contact_name: rawStudentData.emergency_contact_name?.trim() || null,
      emergency_contact_phone: rawStudentData.emergency_contact_phone?.trim() || null
    };

    try {
      const updated = await request(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Update local cache
      const list = getLocalStudents();
      const nextList = list.map(s => (s.id === id ? updated : s));
      saveLocalStudents(nextList);

      return updated;
    } catch (err) {
      console.error('Failed to update student on Laravel backend:', err);
      throw err;
    }
  },

  async deleteStudent(id) {
    try {
      await request(`/students/${id}`, { method: 'DELETE' });

      // Update local cache
      const list = getLocalStudents().filter(s => s.id !== id);
      saveLocalStudents(list);

      const logs = getLocalLogs().filter(l => l.student_id !== id);
      saveLocalLogs(logs);

      return true;
    } catch (err) {
      console.error('Failed to delete student on Laravel backend:', err);
      throw err;
    }
  },

  async bulkCreateStudents(students) {
    try {
      return await request('/students/bulk', {
        method: 'POST',
        body: JSON.stringify({ students })
      });
    } catch (err) {
      console.error('Failed bulk create on Laravel backend:', err);
      throw err;
    }
  },

  async getEmployees() {
    try {
      const data = await request('/employees');
      if (Array.isArray(data)) {
        saveLocalEmployees(data);
        return data;
      }
    } catch (err) {
      console.warn('Backend fetch employees failed, using local cache:', err);
    }
    return getLocalEmployees();
  },

  async createEmployee(rawEmployeeData) {
    try {
      const created = await request('/employees', {
        method: 'POST',
        body: JSON.stringify(rawEmployeeData)
      });
      const list = getLocalEmployees();
      const filtered = list.filter(e => e.id !== created.id && e.employee_id !== created.employee_id);
      filtered.unshift(created);
      saveLocalEmployees(filtered);
      return created;
    } catch (err) {
      console.error('Failed to create employee on backend:', err);
      throw err;
    }
  },

  async updateEmployee(id, rawEmployeeData) {
    try {
      const updated = await request(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rawEmployeeData)
      });
      const list = getLocalEmployees();
      const nextList = list.map(e => (e.id === id ? updated : e));
      saveLocalEmployees(nextList);
      return updated;
    } catch (err) {
      console.error('Failed to update employee on backend:', err);
      throw err;
    }
  },

  async deleteEmployee(id) {
    try {
      await request(`/employees/${id}`, { method: 'DELETE' });
      const list = getLocalEmployees().filter(e => e.id !== id);
      saveLocalEmployees(list);
      return true;
    } catch (err) {
      console.error('Failed to delete employee on backend:', err);
      throw err;
    }
  },

  async findPersonByScan(scannedValue) {
    const trimmed = (scannedValue || '').trim();
    if (!trimmed) return null;

    try {
      const data = await request(`/scan/${encodeURIComponent(trimmed)}`);
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      if (err.status !== 404) {
        console.warn('Unified /scan/{value} endpoint error:', err);
      }
    }

    // Fallback search in local caches
    const localStudents = getLocalStudents();
    const student = localStudents.find(
      s => (s.school_id && s.school_id.toLowerCase() === trimmed.toLowerCase()) ||
           (s.rfid_uid && s.rfid_uid.toLowerCase() === trimmed.toLowerCase())
    );
    if (student) {
      return { ...student, person_type: 'STUDENT' };
    }

    const localEmployees = getLocalEmployees();
    const emp = localEmployees.find(
      e => (e.employee_id && e.employee_id.toLowerCase() === trimmed.toLowerCase()) ||
           (e.rfid_uid && e.rfid_uid.toLowerCase() === trimmed.toLowerCase())
    );
    if (emp) {
      return { ...emp, person_type: 'EMPLOYEE', school_id: emp.employee_id };
    }

    return null;
  }
};

export const adminAuthService = {
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const user = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password
        })
      });

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      throw new Error(err.message || 'Invalid credentials or login failed.');
    }
  },

  async register({ email, password, full_name, role = 'admin', securityKey = '' }) {
    if (!email || !password || !full_name) {
      throw new Error('Please fill in all required fields (Name, Email, Password).');
    }
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      const user = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
          full_name: full_name.trim(),
          role: role || 'admin',
          securityKey
        })
      });

      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      return user;
    } catch (err) {
      throw new Error(err.message || 'Registration failed.');
    }
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' }).catch(() => {});
    } catch {}
    localStorage.removeItem(AUTH_SESSION_KEY);
  }
};
