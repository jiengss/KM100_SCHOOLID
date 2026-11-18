-- ==============================================================================
-- SCHOOL ID SCANNER & ATTENDANCE SYSTEM - SUPABASE DATABASE SCHEMA
-- TECHNICAL-VOCATIONAL & TECHNOLOGY PROGRAMS (NC II SPECIALIZATION)
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create STUDENTS Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id VARCHAR(50) NOT NULL UNIQUE,          -- Unique ID number (e.g., "2024-10001")
    rfid_uid VARCHAR(100) UNIQUE,                   -- Optional RFID / NFC card hex (e.g. "RFID-99101")
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender VARCHAR(20) DEFAULT 'Unspecified',
    grade_level VARCHAR(50) NOT NULL,               -- e.g., "1st Year", "2nd Year", "Grade 11"
    section VARCHAR(50) NOT NULL,                   -- e.g., "CET-1A", "HT-2B", "CAT-1A"
    course_strand VARCHAR(150) NOT NULL,            -- NC II Technology course
    email VARCHAR(150),
    contact_number VARCHAR(30),
    photo_url TEXT,                                 -- URL to student photo
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(50),
    blood_type VARCHAR(10) DEFAULT 'Unknown',
    status VARCHAR(30) DEFAULT 'ACTIVE',            -- 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ALUMNI'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for lightning-fast scan lookups by School ID and RFID UID
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students (school_id);
CREATE INDEX IF NOT EXISTS idx_students_rfid_uid ON public.students (rfid_uid);

-- 3. Create ATTENDANCE_LOGS Table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id VARCHAR(50) NOT NULL,                 -- Denormalized for rapid reporting
    log_type VARCHAR(10) NOT NULL CHECK (log_type IN ('IN', 'OUT')), -- 'IN' for Time-In, 'OUT' for Time-Out
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    gate_station VARCHAR(100) DEFAULT 'Main Gate Kiosk',
    remarks TEXT DEFAULT 'Normal',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for rapid reporting and real-time feeds
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance_logs (school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON public.attendance_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_logs (student_id);

-- 4. Create ADMIN_USERS Table (Administrator Login & Registration)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',               -- 'super_admin', 'admin', 'registrar', 'guard'
    status VARCHAR(30) DEFAULT 'ACTIVE',             -- 'ACTIVE', 'INACTIVE'
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users (email);

-- 5. Automatically update updated_at on tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_students_timestamp ON public.students;
CREATE TRIGGER trigger_update_students_timestamp
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_admin_users_timestamp ON public.admin_users;
CREATE TRIGGER trigger_update_admin_users_timestamp
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public students read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Public students insert/update" ON public.students FOR ALL USING (true);
CREATE POLICY "Public attendance read access" ON public.attendance_logs FOR SELECT USING (true);
CREATE POLICY "Public attendance insert access" ON public.attendance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public admin read access" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Public admin insert registration" ON public.admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public admin update access" ON public.admin_users FOR UPDATE USING (true);

-- 7. Enable Real-Time on attendance_logs, students, and admin_users
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 8. Seed Default Super Administrator (Default Password: admin123)
-- SHA-256 for 'admin123': 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO public.admin_users (email, password_hash, full_name, role, status)
VALUES
    ('admin@km100.edu.ph', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'KM100 Head Administrator', 'super_admin', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- 9. Seed Sample Students with all 7 NC II Technology Courses
INSERT INTO public.students (school_id, rfid_uid, first_name, middle_name, last_name, gender, grade_level, section, course_strand, email, contact_number, photo_url, emergency_contact_name, emergency_contact_phone, blood_type, status)
VALUES
    (
        '2024-10001',
        'RFID-99101',
        'Sophia',
        'Marie',
        'Rodriguez',
        'Female',
        '1st Year',
        'CET-1A',
        'Computer Engineering Technology (NC II)',
        'sophia.rodriguez@school.edu',
        '+1 (555) 234-5678',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'Elena Rodriguez (Mother)',
        '+1 (555) 876-5432',
        'O+',
        'ACTIVE'
    ),
    (
        '2024-10002',
        'RFID-99102',
        'Alexander',
        'James',
        'Chen',
        'Male',
        '2nd Year',
        'HT-2B',
        'Hospitality Technology (NC II)',
        'alexander.chen@school.edu',
        '+1 (555) 345-6789',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        'David Chen (Father)',
        '+1 (555) 987-6543',
        'A+',
        'ACTIVE'
    ),
    (
        '2024-10003',
        'RFID-99103',
        'Isabella',
        'Grace',
        'Santos',
        'Female',
        '1st Year',
        'EET-1A',
        'Electrical Engineering Technology (NC II)',
        'isabella.santos@school.edu',
        '+1 (555) 456-7890',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        'Maria Santos (Mother)',
        '+1 (555) 321-4321',
        'B+',
        'ACTIVE'
    ),
    (
        '2024-10004',
        'RFID-99104',
        'Marcus',
        'Daniel',
        'Johnson',
        'Male',
        '2nd Year',
        'ECET-2A',
        'Electronics Engineering Technology (NC II)',
        'marcus.johnson@school.edu',
        '+1 (555) 567-8901',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        'Robert Johnson (Father)',
        '+1 (555) 654-3210',
        'AB+',
        'ACTIVE'
    ),
    (
        '2024-10005',
        'RFID-99105',
        'Chloe',
        'Anne',
        'Taylor',
        'Female',
        '1st Year',
        'TT-1A',
        'Tourism Technology (NC II)',
        'chloe.taylor@school.edu',
        '+1 (555) 678-9012',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        'Sarah Taylor (Mother)',
        '+1 (555) 432-1098',
        'O-',
        'ACTIVE'
    ),
    (
        '2024-10006',
        'RFID-99106',
        'Gabriel',
        'Cruz',
        'Velasco',
        'Male',
        '2nd Year',
        'CAT-2A',
        'Culinary Arts Technology (NC II)',
        'gabriel.velasco@school.edu',
        '+1 (555) 789-0123',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        'Antonio Velasco (Father)',
        '+1 (555) 901-2345',
        'A+',
        'ACTIVE'
    ),
    (
        '2024-10007',
        'RFID-99107',
        'Jasmine',
        'Rose',
        'Flores',
        'Female',
        '1st Year',
        'ROT-1B',
        'Restaurant Operations Technology (NC II)',
        'jasmine.flores@school.edu',
        '+1 (555) 890-1234',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        'Luz Flores (Mother)',
        '+1 (555) 012-3456',
        'B+',
        'ACTIVE'
    )
ON CONFLICT (school_id) DO UPDATE SET
    course_strand = EXCLUDED.course_strand,
    section = EXCLUDED.section;
