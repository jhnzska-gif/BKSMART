-- ==============================================================================
-- BKSmart (Platform Digital Bimbingan Konseling Sekolah)
-- Database: NeonDB (PostgreSQL)
-- Complete Schema Definition
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  avatar TEXT,
  nip_or_nisn TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  assigned_class TEXT,
  grade_level TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS majors (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  head_of_major TEXT
);

CREATE TABLE IF NOT EXISTS academic_years (
  id TEXT PRIMARY KEY,
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  nip TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'L',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'teacher',
  specialization TEXT,
  assigned_class TEXT
);

CREATE TABLE IF NOT EXISTS school_classes (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  grade TEXT NOT NULL,
  major_id TEXT NOT NULL,
  major_name TEXT NOT NULL,
  homeroom_teacher_id TEXT,
  homeroom_teacher_name TEXT,
  student_count INTEGER NOT NULL DEFAULT 0,
  academic_year TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nisn TEXT NOT NULL,
  nis TEXT NOT NULL,
  name TEXT NOT NULL,
  gender TEXT NOT NULL DEFAULT 'L',
  class_id TEXT NOT NULL,
  class_name TEXT NOT NULL,
  major_id TEXT NOT NULL,
  major_name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  parent_name TEXT NOT NULL DEFAULT '-',
  parent_phone TEXT NOT NULL DEFAULT '-',
  student_phone TEXT NOT NULL DEFAULT '-',
  address TEXT NOT NULL DEFAULT '-',
  status TEXT NOT NULL DEFAULT 'active',
  counseling_count INTEGER NOT NULL DEFAULT 0,
  open_cases_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS counseling_sessions (
  id TEXT PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  counselor_id TEXT NOT NULL,
  counselor_name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'individual',
  domain TEXT NOT NULL DEFAULT 'pribadi',
  session_date TEXT NOT NULL,
  session_time TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Ruang BK',
  status TEXT NOT NULL DEFAULT 'scheduled',
  problem_summary TEXT NOT NULL DEFAULT '',
  confidential_notes TEXT DEFAULT '',
  action_plan TEXT DEFAULT '',
  outcome_summary TEXT DEFAULT '',
  follow_up_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referral_number TEXT UNIQUE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  referred_by_teacher_id TEXT NOT NULL,
  referred_by_teacher_name TEXT NOT NULL,
  counselor_id TEXT,
  counselor_name TEXT,
  reason TEXT NOT NULL DEFAULT '',
  indicators JSONB NOT NULL DEFAULT '[]'::jsonb,
  urgency TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  counselor_feedback TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS student_cases (
  id TEXT PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'kedisiplinan',
  priority TEXT NOT NULL DEFAULT 'sedang',
  status TEXT NOT NULL DEFAULT 'investigasi',
  assigned_counselor_id TEXT NOT NULL,
  assigned_counselor_name TEXT NOT NULL,
  incident_date TEXT NOT NULL,
  chronology_summary TEXT NOT NULL DEFAULT '',
  confidential_details TEXT DEFAULT '',
  interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bk_programs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'pribadi',
  target_grade TEXT NOT NULL DEFAULT 'Semua',
  semester TEXT NOT NULL DEFAULT 'Genap',
  academic_year TEXT NOT NULL DEFAULT '2024/2025',
  objectives TEXT NOT NULL DEFAULT '',
  scheduled_month TEXT NOT NULL DEFAULT 'Maret 2025',
  status TEXT NOT NULL DEFAULT 'planned',
  completion_percentage INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target_class TEXT NOT NULL DEFAULT 'Semua Kelas',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  deadline TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  submission_count INTEGER NOT NULL DEFAULT 0,
  total_target INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL,
  assessment_title TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_class TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS bk_materials (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'pribadi',
  target_grade TEXT NOT NULL DEFAULT 'Semua Tingkat',
  author_name TEXT NOT NULL DEFAULT 'Guru BK',
  summary TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  has_task BOOLEAN NOT NULL DEFAULT FALSE,
  task_prompt TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  read_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT NOT NULL,
  ip_address TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_counseling_date ON counseling_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
