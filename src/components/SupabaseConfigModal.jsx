import React, { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { 
  Database, 
  X, 
  Check, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Code, 
  KeyRound, 
  Sparkles,
  Server
} from 'lucide-react';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, dbService } from '../lib/supabaseClient';

const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- KM100 SKILLS AND TRAINING CENTER, INC.
-- SCHOOL ID SCANNER & ATTENDANCE SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create STUDENTS Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id VARCHAR(50) NOT NULL UNIQUE,
    rfid_uid VARCHAR(100) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Unspecified',
    grade_level VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,
    course_strand VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    contact_number VARCHAR(30),
    photo_url TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10) DEFAULT 'Unknown',
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students (school_id);
CREATE INDEX IF NOT EXISTS idx_students_rfid_uid ON public.students (rfid_uid);

-- 2. Create ATTENDANCE_LOGS Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL,
    log_type VARCHAR(10) NOT NULL CHECK (log_type IN ('IN', 'OUT')),
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    gate_station VARCHAR(100) DEFAULT 'Main Gate Kiosk',
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance_logs (school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance_logs (timestamp DESC);

-- 3. Create ADMIN_USERS Table (Admin Login & Registration)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(30) DEFAULT 'ACTIVE',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);

-- 4. Row Level Security (RLS) Setup
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public students read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public students insert/update" ON public.students FOR ALL USING (true);
CREATE POLICY "Public attendance read access" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Public attendance insert access" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public admin read access" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public admin registration" ON public.admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public admin update access" ON public.admin_users FOR UPDATE USING (true);

-- 5. Enable Real-Time
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 6. Seed Default Super Administrator (Password: admin123)
INSERT INTO public.admin_users (email, password_hash, full_name, role, status)
VALUES
    ('admin@km100.edu.ph', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KM100 Head Administrator', 'super_admin', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 7. Seed Initial Sample Students (7 NC II Technology Programs - 16 columns each)
INSERT INTO public.students (school_id, rfid_uid, first_name, middle_name, last_name, gender, grade_level, section, course_strand, email, contact_number, photo_url, emergency_contact_name, emergency_contact_phone, blood_type, status)
VALUES
    ('2024-10001', 'RFID-99101', 'Sophia', 'Marie', 'Rodriguez', 'Female', '1st Year', 'CET-1A', 'Computer Engineering Technology (NC II)', 'sophia.rodriguez@school.edu', '+1 (555) 234-5678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Elena Rodriguez (Mother)', '+1 (555) 876-5432', 'O+', 'ACTIVE'),
    ('2024-10002', 'RFID-99102', 'Alexander', 'James', 'Chen', 'Male', '2nd Year', 'HT-2B', 'Hospitality Technology (NC II)', 'alexander.chen@school.edu', '+1 (555) 345-6789', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400', 'David Chen (Father)', '+1 (555) 987-6543', 'A+', 'ACTIVE'),
    ('2024-10003', 'RFID-99103', 'Isabella', 'Grace', 'Santos', 'Female', '1st Year', 'EET-1A', 'Electrical Engineering Technology (NC II)', 'isabella.santos@school.edu', '+1 (555) 456-7890', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', 'Maria Santos (Mother)', '+1 (555) 321-4321', 'B+', 'ACTIVE'),
    ('2024-10004', 'RFID-99104', 'Marcus', 'Daniel', 'Johnson', 'Male', '2nd Year', 'ECET-2A', 'Electronics Engineering Technology (NC II)', 'marcus.johnson@school.edu', '+1 (555) 567-8901', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Robert Johnson (Father)', '+1 (555) 654-3210', 'AB+', 'ACTIVE'),
    ('2024-10005', 'RFID-99105', 'Chloe', 'Anne', 'Taylor', 'Female', '1st Year', 'TT-1A', 'Tourism Technology (NC II)', 'chloe.taylor@school.edu', '+1 (555) 678-9012', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Sarah Taylor (Mother)', '+1 (555) 432-1098', 'O-', 'ACTIVE'),
    ('2024-10006', 'RFID-99106', 'Gabriel', 'Cruz', 'Velasco', 'Male', '2nd Year', 'CAT-2A', 'Culinary Arts Technology (NC II)', 'gabriel.velasco@school.edu', '+1 (555) 789-0123', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Antonio Velasco (Father)', '+1 (555) 901-2345', 'A+', 'ACTIVE'),
    ('2024-10007', 'RFID-99107', 'Jasmine', 'Rose', 'Flores', 'Female', '1st Year', 'ROT-1B', 'Restaurant Operations Technology (NC II)', 'jasmine.flores@school.edu', '+1 (555) 890-1234', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'Luz Flores (Mother)', '+1 (555) 012-3456', 'B+', 'ACTIVE')
ON CONFLICT (school_id) DO UPDATE SET
    course_strand = EXCLUDED.course_strand,
    section = EXCLUDED.section,
    grade_level = EXCLUDED.grade_level;`;

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const current = getStoredSupabaseConfig();
  const [url, setUrl] = useState(current.url || '');
  const [anonKey, setAnonKey] = useState(current.anonKey || '');
  const [testStatus, setTestStatus] = useState(null); // { success, message }
  const [testing, setTesting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('credentials'); // credentials, sql
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredSupabaseConfig(url, anonKey);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestStatus(null);
    saveStoredSupabaseConfig(url, anonKey);
    const res = await dbService.testConnection();
    setTestStatus(res);
    setTesting(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetToDemo = () => {
    saveStoredSupabaseConfig('', '');
    setUrl('');
    setAnonKey('');
    setTestStatus({ success: true, message: 'Reset to built-in local demo mode.' });
    if (onConfigSaved) onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Supabase Backend Configuration</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Connect your Supabase PostgreSQL database or copy the SQL schema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center px-6 pt-4 gap-2 bg-slate-100/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'credentials'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Connection Credentials</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
              activeSubTab === 'sql'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Supabase Database SQL Schema</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeSubTab === 'credentials' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 text-xs text-blue-800 dark:text-blue-200">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-blue-900 dark:text-blue-300">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Quick Setup Guide:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 mt-1">
                  <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Copy and run the database script from the <strong>Supabase Database SQL Schema</strong> tab in your Supabase SQL Editor</li>
                  <li>In your Supabase project, go to <strong>Project Settings &gt; API</strong> and copy your Project URL & Anon Key below:</li>
                </ol>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzprojectid.supabase.co"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Anon / Public API Key
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>

              {testStatus && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    testStatus.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {testStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testStatus.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!url || !anonKey || testing}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-white rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 transition"
                >
                  {testing ? 'Testing...' : 'Test Live Connection'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition"
                >
                  Use Built-in Local Demo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Run this script once in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to create tables, indexes, and sample students:
                </p>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
                </button>
              </div>

              <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-x-auto max-h-[360px]">
                <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30"
          >
            Save & Connect
          </button>
        </div>
      </div>

      {/* Switch to Local Demo Confirmation */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          handleResetToDemo();
        }}
        title="Reset to Built-in Demo"
        message="Are you sure you want to clear your current Supabase credentials and switch to the offline local demo dataset? Live database synchronization will be paused."
        confirmText="Reset to Demo"
        cancelText="Cancel"
        variant="warning"
        icon={Server}
      />
    </div>
  );
}
