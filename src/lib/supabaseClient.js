import { createClient } from '@supabase/supabase-js';
import { INITIAL_STUDENTS, INITIAL_LOGS } from './mockData';

// Check localStorage first (in case user configured it via the UI), then Vite env
const STORAGE_KEY_URL = 'km100_supabase_url';
const STORAGE_KEY_ANON = 'km100_supabase_anon';

export function getStoredSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEY_URL) || import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function saveStoredSupabaseConfig(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
}

// In-memory / LocalStorage fallback database
const LOCAL_STUDENTS_KEY = 'km100_local_students';
const LOCAL_LOGS_KEY = 'km100_local_attendance_logs';

function getLocalStudents() {
  const data = localStorage.getItem(LOCAL_STUDENTS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  }
  try {
    const parsed = JSON.parse(data);
    // If old mock data was stored, automatically refresh with updated NC II courses
    if (parsed.length > 0 && parsed[0].course_strand && !parsed[0].course_strand.includes('NC II')) {
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    return parsed;
  } catch {
    return INITIAL_STUDENTS;
  }
}

function saveLocalStudents(students) {
  localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(students));
}

function getLocalLogs() {
  const data = localStorage.getItem(LOCAL_LOGS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(INITIAL_LOGS));
    return INITIAL_LOGS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_LOGS;
  }
}

function saveLocalLogs(logs) {
  localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
}

let supabaseInstance = null;
let currentConfig = { url: '', anonKey: '' };

export function getSupabase() {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }
  if (!supabaseInstance || currentConfig.url !== url || currentConfig.anonKey !== anonKey) {
    currentConfig = { url, anonKey };
    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
}

export const dbService = {
  isConfigured() {
    return !!getSupabase();
  },

  async testConnection() {
    const sb = getSupabase();
    if (!sb) return { success: false, message: "Supabase URL and Anon Key are missing." };
    try {
      const { data, error } = await sb.from('students').select('id').limit(1);
      if (error) throw error;
      return { success: true, message: "Connected successfully to Supabase!" };
    } catch (err) {
      return { success: false, message: err.message || "Failed to connect to Supabase." };
    }
  },

  async getStudents() {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('students')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn("Supabase fetch students failed, using local storage:", err);
      }
    }
    return getLocalStudents();
  },

  async findStudentByScan(scannedValue) {
    const trimmed = scannedValue.trim();
    if (!trimmed) return null;

    const sb = getSupabase();
    if (sb) {
      try {
        // Try exact match on school_id first, then rfid_uid
        const { data, error } = await sb
          .from('students')
          .select('*')
          .or(`school_id.eq.${trimmed},rfid_uid.eq.${trimmed}`)
          .limit(1);
        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        console.warn("Supabase findStudentByScan failed, falling back to local:", err);
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
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('attendance_logs')
          .select('*')
          .eq('student_id', studentId)
          .order('timestamp', { ascending: false })
          .limit(1);
        if (!error && data && data.length > 0) return data[0];
      } catch (err) {
        console.warn("Supabase getLastAttendance failed:", err);
      }
    }

    const logs = getLocalLogs();
    const studentLogs = logs.filter(l => l.student_id === studentId);
    return studentLogs[0] || null;
  },

  async recordAttendance({ student, logType, gate = 'Main Gate Kiosk', remarks = 'Normal' }) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      student_id: student.id,
      school_id: student.school_id,
      log_type: logType,
      timestamp,
      gate_station: gate,
      remarks,
      student: student
    };

    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('attendance_logs')
          .insert([{
            student_id: student.id,
            school_id: student.school_id,
            log_type: logType,
            timestamp,
            gate_station: gate,
            remarks
          }])
          .select()
          .single();
        if (!error && data) {
          logEntry.id = data.id;
        }
      } catch (err) {
        console.warn("Failed recording attendance to Supabase, logging locally:", err);
      }
    }

    // Also persist to local list for snappy immediate display
    const currentLogs = getLocalLogs();
    const updated = [logEntry, ...currentLogs].slice(0, 500); // keep last 500
    saveLocalLogs(updated);

    return logEntry;
  },

  async getRecentLogs(limit = 50) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('attendance_logs')
          .select('*, student:students(*)')
          .order('timestamp', { ascending: false })
          .limit(limit);
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Supabase getRecentLogs failed, using local:", err);
      }
    }
    return getLocalLogs().slice(0, limit);
  },

  async createStudent(studentData) {
    const id = crypto.randomUUID ? crypto.randomUUID() : `std-${Date.now()}`;
    const newStudent = {
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'ACTIVE',
      ...studentData
    };

    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('students')
          .insert([studentData])
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error("Supabase create student error:", err);
        throw err;
      }
    }

    // Local fallback
    const list = getLocalStudents();
    list.unshift(newStudent);
    saveLocalStudents(list);
    return newStudent;
  },

  async updateStudent(id, studentData) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('students')
          .update(studentData)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.error("Supabase update student error:", err);
        throw err;
      }
    }

    const list = getLocalStudents();
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...studentData, updated_at: new Date().toISOString() };
      saveLocalStudents(list);
      return list[idx];
    }
    return null;
  },

  async deleteStudent(id) {
    const sb = getSupabase();
    if (sb) {
      try {
        const { error } = await sb.from('students').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase delete student error:", err);
        throw err;
      }
    }

    const list = getLocalStudents();
    const updated = list.filter(s => s.id !== id);
    saveLocalStudents(updated);
    return true;
  }
};

// ==============================================================================
// ADMIN AUTHENTICATION & USER MANAGEMENT SERVICE
// ==============================================================================
const LOCAL_ADMINS_KEY = 'km100_local_admin_users';
const AUTH_SESSION_KEY = 'km100_auth_user';

// Built-in Seed Admin: admin@km100.edu.ph / admin123
// SHA-256 for 'admin123': 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
const DEFAULT_ADMIN = {
  id: 'admin-001',
  email: 'admin@km100.edu.ph',
  password_hash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  full_name: 'KM100 Head Administrator',
  role: 'super_admin',
  status: 'ACTIVE',
  created_at: new Date().toISOString()
};

export async function hashPassword(plainText) {
  if (!plainText) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    return plainText;
  }
}

function getLocalAdmins() {
  const data = localStorage.getItem(LOCAL_ADMINS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify([DEFAULT_ADMIN]));
    return [DEFAULT_ADMIN];
  }
  try {
    const parsed = JSON.parse(data);
    if (!parsed || parsed.length === 0) {
      localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    return parsed;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

function saveLocalAdmins(admins) {
  localStorage.setItem(LOCAL_ADMINS_KEY, JSON.stringify(admins));
}

export const adminAuthService = {
  getCurrentUser() {
    try {
      const data = localStorage.getItem(AUTH_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async login({ email, password }) {
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }
    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);

    const sb = getSupabase();
    if (sb) {
      try {
        const { data, error } = await sb
          .from('admin_users')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (error) {
          console.warn("Supabase admin_users query notice:", error.message);
        } else if (data) {
          if (data.password_hash === hashed || data.password_hash === password) {
            if (data.status !== 'ACTIVE') {
              throw new Error("This admin account is currently inactive. Contact school administration.");
            }
            await sb
              .from('admin_users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.id)
              .catch(() => {});

            const sessionUser = {
              id: data.id,
              email: data.email,
              full_name: data.full_name,
              role: data.role || 'admin',
              status: data.status
            };
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
            return sessionUser;
          } else {
            throw new Error("Invalid password. Please check your credentials.");
          }
        }
      } catch (err) {
        if (err.message.includes("Invalid password") || err.message.includes("inactive")) {
          throw err;
        }
        console.warn("Supabase auth fallback to local:", err.message);
      }
    }

    // LocalStorage Fallback check
    const localList = getLocalAdmins();
    const found = localList.find(a => a.email.toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error("No administrator account found with this email.");
    }

    if (found.password_hash === hashed || found.password_hash === password) {
      if (found.status && found.status !== 'ACTIVE') {
        throw new Error("This admin account is inactive.");
      }
      const sessionUser = {
        id: found.id,
        email: found.email,
        full_name: found.full_name,
        role: found.role || 'admin',
        status: found.status || 'ACTIVE'
      };
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    } else {
      throw new Error("Invalid password. Please check your credentials.");
    }
  },

  async register({ email, password, full_name, role = 'admin', securityKey = '' }) {
    if (!email || !password || !full_name) {
      throw new Error("Please fill in all required fields (Name, Email, Password).");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // Validation for school registration key if provided
    if (securityKey && securityKey.trim() !== 'KM100-ADMIN-2024' && securityKey.trim() !== 'KM100-2024') {
      throw new Error("Invalid Registration Passcode. Please contact the administrator.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const newAdmin = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'admin-' + Date.now(),
      email: cleanEmail,
      password_hash: hashed,
      full_name: full_name.trim(),
      role: role || 'admin',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    const sb = getSupabase();
    if (sb) {
      try {
        const { data: existing } = await sb
          .from('admin_users')
          .select('id')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (existing) {
          throw new Error("An administrator with this email is already registered.");
        }

        const { data, error } = await sb
          .from('admin_users')
          .insert([{
            email: newAdmin.email,
            password_hash: newAdmin.password_hash,
            full_name: newAdmin.full_name,
            role: newAdmin.role,
            status: newAdmin.status
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          newAdmin.id = data.id;
        }
      } catch (err) {
        if (err.message.includes("already registered")) throw err;
        console.warn("Supabase register notice, fallback to local:", err.message);
      }
    }

    // Local storage persistence
    const localList = getLocalAdmins();
    if (localList.some(a => a.email.toLowerCase() === cleanEmail)) {
      throw new Error("An administrator with this email is already registered.");
    }
    localList.push(newAdmin);
    saveLocalAdmins(localList);

    const sessionUser = {
      id: newAdmin.id,
      email: newAdmin.email,
      full_name: newAdmin.full_name,
      role: newAdmin.role,
      status: newAdmin.status
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  },

  logout() {
    localStorage.removeItem(AUTH_SESSION_KEY);
    const sb = getSupabase();
    if (sb && sb.auth) {
      sb.auth.signOut().catch(() => {});
    }
  }
};
