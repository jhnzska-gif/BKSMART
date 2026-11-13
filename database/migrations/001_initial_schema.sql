-- ==============================================================================
-- BKSmart (Platform Digital Bimbingan Konseling Sekolah)
-- Database: PostgreSQL 16
-- Initial Migration Schema
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'counselor', 'teacher', 'student', 'principal');
CREATE TYPE counseling_type AS ENUM ('individual', 'group', 'classical', 'home_visit');
CREATE TYPE guidance_domain AS ENUM ('pribadi', 'sosial', 'belajar', 'karier');
CREATE TYPE counseling_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'follow_up');
CREATE TYPE referral_status AS ENUM ('pending', 'accepted', 'scheduled', 'resolved', 'declined');
CREATE TYPE case_priority AS ENUM ('rendah', 'sedang', 'tinggi', 'darurat');
CREATE TYPE case_status AS ENUM ('investigasi', 'penanganan', 'tindak_lanjut', 'selesai');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE,
    role user_role NOT NULL DEFAULT 'student',
    nip_or_nisn VARCHAR(32),
    phone VARCHAR(32),
    assigned_class VARCHAR(32),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MAJORS & CLASSES
CREATE TABLE IF NOT EXISTS majors (
    id VARCHAR(32) PRIMARY KEY,
    code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    head_of_major VARCHAR(128)
);

CREATE TABLE IF NOT EXISTS school_classes (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(32) UNIQUE NOT NULL,
    grade VARCHAR(4) NOT NULL,
    major_id VARCHAR(32) REFERENCES majors(id) ON DELETE SET NULL,
    homeroom_teacher_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    student_count INT DEFAULT 0,
    academic_year VARCHAR(16) NOT NULL
);

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(64) PRIMARY KEY,
    nisn VARCHAR(16) UNIQUE NOT NULL,
    nis VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    gender CHAR(1) CHECK (gender IN ('L', 'P')),
    class_id VARCHAR(32) REFERENCES school_classes(id) ON DELETE SET NULL,
    major_id VARCHAR(32) REFERENCES majors(id) ON DELETE SET NULL,
    academic_year VARCHAR(16) NOT NULL,
    parent_name VARCHAR(128),
    parent_phone VARCHAR(32),
    student_phone VARCHAR(32),
    address TEXT,
    status VARCHAR(16) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. COUNSELING SESSIONS (With Confidential Notes Isolation)
CREATE TABLE IF NOT EXISTS counseling_sessions (
    id VARCHAR(64) PRIMARY KEY,
    ticket_number VARCHAR(32) UNIQUE NOT NULL,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    counselor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    counseling_type counseling_type NOT NULL DEFAULT 'individual',
    domain guidance_domain NOT NULL DEFAULT 'pribadi',
    session_date DATE NOT NULL,
    session_time TIME NOT NULL,
    location VARCHAR(128) DEFAULT 'Ruang BK',
    status counseling_status NOT NULL DEFAULT 'scheduled',
    problem_summary TEXT NOT NULL,
    confidential_notes TEXT, -- PRIVAT / RAHASIA HANYA UNTUK GURU BK
    action_plan TEXT,
    outcome_summary TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. REFERRALS (Rujukan dari Wali Kelas)
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(64) PRIMARY KEY,
    referral_number VARCHAR(32) UNIQUE NOT NULL,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    referred_by_teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    counselor_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    indicators TEXT[],
    urgency VARCHAR(16) DEFAULT 'medium',
    status referral_status NOT NULL DEFAULT 'pending',
    counselor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. STUDENT CASES (Bimbingan Kasus)
CREATE TABLE IF NOT EXISTS student_cases (
    id VARCHAR(64) PRIMARY KEY,
    case_number VARCHAR(32) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    student_id VARCHAR(64) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    priority case_priority NOT NULL DEFAULT 'sedang',
    status case_status NOT NULL DEFAULT 'investigasi',
    assigned_counselor_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    incident_date DATE NOT NULL,
    chronology_summary TEXT NOT NULL,
    confidential_details TEXT, -- SANGAT RAHASIA
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    module VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_counseling_student ON counseling_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_date ON counseling_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_referrals_student ON referrals(student_id);
CREATE INDEX IF NOT EXISTS idx_cases_student ON student_cases(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
