import { Pool } from 'pg';
import type {
  User,
  Student,
  Teacher,
  SchoolClass,
  Major,
  AcademicYear,
  CounselingSession,
  Referral,
  StudentCase,
  BKProgram,
  Assessment,
  AssessmentSubmission,
  BKMaterial,
  AuditLog,
} from '../src/types/index.ts';
import {
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_CLASSES,
  INITIAL_MAJORS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_COUNSELING_SESSIONS,
  INITIAL_REFERRALS,
  INITIAL_CASES,
  INITIAL_PROGRAMS,
  INITIAL_ASSESSMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_MATERIALS,
  INITIAL_AUDIT_LOGS,
} from '../src/services/mockData.ts';

declare global {
  var _bksmartNeonPool: Pool | undefined;
  var _bksmartSchemaPromise: Promise<void> | undefined;
}

export function getDatabaseUrl(): string | undefined {
  const raw =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.PG_CONNECTION_STRING;

  if (!raw) return undefined;
  let url = raw.trim();
  if (url.toLowerCase().startsWith('psql ')) {
    url = url.slice(5).trim();
  }
  if (
    (url.startsWith("'") && url.endsWith("'")) ||
    (url.startsWith('"') && url.endsWith('"'))
  ) {
    url = url.slice(1, -1).trim();
  }
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    parsed.searchParams.delete('channel_binding');
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isNeonConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;

  if (!global._bksmartNeonPool) {
    const needsSsl =
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require') ||
      process.env.NODE_ENV === 'production';

    global._bksmartNeonPool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    global._bksmartNeonPool.on('error', (err) => {
      console.error('Unexpected error on idle Neon PostgreSQL pool client:', err);
    });
  }

  return global._bksmartNeonPool;
}

// In-memory store used only when DATABASE_URL is not yet configured in environment
export interface MemoryStore {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  majors: Major[];
  academicYears: AcademicYear[];
  counselingSessions: CounselingSession[];
  referrals: Referral[];
  cases: StudentCase[];
  programs: BKProgram[];
  assessments: Assessment[];
  submissions: AssessmentSubmission[];
  materials: BKMaterial[];
  auditLogs: AuditLog[];
}

export const memoryStore: MemoryStore = {
  users: structuredClone(INITIAL_USERS),
  students: structuredClone(INITIAL_STUDENTS),
  teachers: structuredClone(INITIAL_TEACHERS),
  classes: structuredClone(INITIAL_CLASSES),
  majors: structuredClone(INITIAL_MAJORS),
  academicYears: structuredClone(INITIAL_ACADEMIC_YEARS),
  counselingSessions: structuredClone(INITIAL_COUNSELING_SESSIONS),
  referrals: structuredClone(INITIAL_REFERRALS),
  cases: structuredClone(INITIAL_CASES),
  programs: structuredClone(INITIAL_PROGRAMS),
  assessments: structuredClone(INITIAL_ASSESSMENTS),
  submissions: structuredClone(INITIAL_SUBMISSIONS),
  materials: structuredClone(INITIAL_MATERIALS),
  auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
};

const SCHEMA_SQL = `
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
`;

async function seedInitialData(pool: Pool): Promise<void> {
  for (const u of INITIAL_USERS) {
    await pool.query(
      `INSERT INTO users (id, username, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO NOTHING`,
      [u.id, u.username, u.name, u.email, u.role, u.avatar ?? null, u.nipOrNisn ?? '', u.phone ?? '', u.assignedClass ?? null, u.gradeLevel ?? null, u.active, u.createdAt]
    );
  }

  for (const m of INITIAL_MAJORS) {
    await pool.query(
      `INSERT INTO majors (id, code, name, head_of_major) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [m.id, m.code, m.name, m.headOfMajor ?? null]
    );
  }

  for (const ay of INITIAL_ACADEMIC_YEARS) {
    await pool.query(
      `INSERT INTO academic_years (id, year, semester, is_active) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [ay.id, ay.year, ay.semester, ay.isActive]
    );
  }

  for (const t of INITIAL_TEACHERS) {
    await pool.query(
      `INSERT INTO teachers (id, nip, name, gender, email, phone, role, specialization, assigned_class)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [t.id, t.nip, t.name, t.gender, t.email, t.phone, t.role, t.specialization ?? null, t.assignedClass ?? null]
    );
  }

  for (const c of INITIAL_CLASSES) {
    await pool.query(
      `INSERT INTO school_classes (id, name, grade, major_id, major_name, homeroom_teacher_id, homeroom_teacher_name, student_count, academic_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.grade, c.majorId, c.majorName, c.homeroomTeacherId ?? null, c.homeroomTeacherName ?? null, c.studentCount, c.academicYear]
    );
  }

  for (const s of INITIAL_STUDENTS) {
    await pool.query(
      `INSERT INTO students (id, nisn, nis, name, gender, class_id, class_name, major_id, major_name, academic_year, parent_name, parent_phone, student_phone, address, status, counseling_count, open_cases_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.nisn, s.nis, s.name, s.gender, s.classId, s.className, s.majorId, s.majorName, s.academicYear, s.parentName, s.parentPhone, s.studentPhone, s.address, s.status, s.counselingCount ?? 0, s.openCasesCount ?? 0]
    );
  }

  for (const cs of INITIAL_COUNSELING_SESSIONS) {
    await pool.query(
      `INSERT INTO counseling_sessions (id, ticket_number, student_id, student_name, student_class, counselor_id, counselor_name, type, domain, session_date, session_time, location, status, problem_summary, confidential_notes, action_plan, outcome_summary, follow_up_date, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO NOTHING`,
      [cs.id, cs.ticketNumber, cs.studentId, cs.studentName, cs.studentClass, cs.counselorId, cs.counselorName, cs.type, cs.domain, cs.sessionDate, cs.sessionTime, cs.location, cs.status, cs.problemSummary, cs.confidentialNotes ?? '', cs.actionPlan ?? '', cs.outcomeSummary ?? '', cs.followUpDate ?? null, cs.createdAt]
    );
  }

  for (const r of INITIAL_REFERRALS) {
    await pool.query(
      `INSERT INTO referrals (id, referral_number, student_id, student_name, student_class, referred_by_teacher_id, referred_by_teacher_name, counselor_id, counselor_name, reason, indicators, urgency, status, counselor_feedback, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.referralNumber, r.studentId, r.studentName, r.studentClass, r.referredByTeacherId, r.referredByTeacherName, r.counselorId ?? null, r.counselorName ?? null, r.reason, JSON.stringify(r.indicators || []), r.urgency, r.status, r.counselorFeedback ?? '', r.createdAt, r.updatedAt]
    );
  }

  for (const c of INITIAL_CASES) {
    await pool.query(
      `INSERT INTO student_cases (id, case_number, title, student_id, student_name, student_class, category, priority, status, assigned_counselor_id, assigned_counselor_name, incident_date, chronology_summary, confidential_details, interventions, resolution_notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18)
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.caseNumber, c.title, c.studentId, c.studentName, c.studentClass, c.category, c.priority, c.status, c.assignedCounselorId, c.assignedCounselorName, c.incidentDate, c.chronologySummary, c.confidentialDetails ?? '', JSON.stringify(c.interventions || []), c.resolutionNotes ?? '', c.createdAt, c.updatedAt]
    );
  }

  for (const p of INITIAL_PROGRAMS) {
    await pool.query(
      `INSERT INTO bk_programs (id, title, domain, target_grade, semester, academic_year, objectives, scheduled_month, status, completion_percentage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.title, p.domain, p.targetGrade, p.semester, p.academicYear, p.objectives, p.scheduledMonth, p.status, p.completionPercentage]
    );
  }

  for (const a of INITIAL_ASSESSMENTS) {
    await pool.query(
      `INSERT INTO assessments (id, title, code, description, target_class, questions, deadline, status, submission_count, total_target)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [a.id, a.title, a.code, a.description, a.targetClass, JSON.stringify(a.questions || []), a.deadline, a.status, a.submissionCount, a.totalTarget]
    );
  }

  for (const sub of INITIAL_SUBMISSIONS) {
    await pool.query(
      `INSERT INTO assessment_submissions (id, assessment_id, assessment_title, student_id, student_name, student_class, submitted_at, answers, result_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [sub.id, sub.assessmentId, sub.assessmentTitle, sub.studentId, sub.studentName, sub.studentClass, sub.submittedAt, JSON.stringify(sub.answers || {}), JSON.stringify(sub.resultSummary || {})]
    );
  }

  for (const m of INITIAL_MATERIALS) {
    await pool.query(
      `INSERT INTO bk_materials (id, title, domain, target_grade, author_name, summary, content, has_task, task_prompt, created_at, read_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.title, m.domain, m.targetGrade, m.authorName, m.summary, m.content, m.hasTask, m.taskPrompt ?? '', m.createdAt, m.readCount]
    );
  }

  for (const log of INITIAL_AUDIT_LOGS) {
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, module, description, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO NOTHING`,
      [log.id, log.timestamp, log.userId, log.userName, log.userRole, log.action, log.module, log.description, log.ipAddress]
    );
  }
}

export async function ensureNeonReady(): Promise<Pool | null> {
  const pool = getPool();
  if (!pool) return null;

  if (!global._bksmartSchemaPromise) {
    global._bksmartSchemaPromise = (async () => {
      await pool.query(SCHEMA_SQL);
      await seedInitialData(pool);
    })().catch((err) => {
      global._bksmartSchemaPromise = undefined;
      throw err;
    });
  }

  await global._bksmartSchemaPromise;
  return pool;
}
