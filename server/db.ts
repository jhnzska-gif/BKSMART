import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
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

export function resetPool(): void {
  if (global._bksmartNeonPool) {
    global._bksmartNeonPool.end().catch(() => {});
    global._bksmartNeonPool = undefined;
    global._bksmartSchemaPromise = undefined;
  }
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
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: process.env.VERCEL ? 10000 : 30000,
      connectionTimeoutMillis: 15000,
    });

    global._bksmartNeonPool.on('error', (err) => {
      console.error('Unexpected error on idle Neon PostgreSQL pool client:', err);
      global._bksmartNeonPool = undefined;
    });
  }

  return global._bksmartNeonPool;
}

export function isTransientConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const code = (err as { code?: string }).code || '';
  return (
    msg.includes('connection terminated') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('connection error') ||
    msg.includes('socket hang up') ||
    code === '57P01' ||
    code === '57P02' ||
    code === '57P03' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT'
  );
}

export async function withNeonRetry<T>(fn: (pool: Pool) => Promise<T>): Promise<T | null> {
  const pool = await ensureNeonReady();
  if (!pool) return null;
  try {
    return await fn(pool);
  } catch (err) {
    if (isTransientConnectionError(err)) {
      console.warn('Transient NeonDB connection error, resetting pool and retrying once...');
      resetPool();
      const retryPool = await ensureNeonReady();
      if (!retryPool) return null;
      return await fn(retryPool);
    }
    throw err;
  }
}

export const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

export const DEFAULT_ROLE_PASSWORDS: Record<string, string> = {
  'u-1': DEFAULT_ADMIN_PASSWORD,
  'u-2': 'bk123',
  'u-3': 'wali123',
  'u-4': 'siswa123',
  'u-5': 'kepsek123',
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith('scrypt:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, keyHex] = parts;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = scryptSync(password, salt, 64);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }
  return false;
}

// In-memory store used only when DATABASE_URL is not yet configured in environment
export interface MemoryStore {
  users: User[];
  userPasswords: Record<string, string>;
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
  userPasswords: Object.fromEntries(
    Object.entries(DEFAULT_ROLE_PASSWORDS).map(([id, pw]) => [id, hashPassword(pw)])
  ),
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
  password_hash TEXT NOT NULL DEFAULT '',
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

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';

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

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_class_name ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_counseling_date ON counseling_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
`;

async function seedInitialData(pool: Pool): Promise<void> {
  // One-time migration: purge old dummy operational data from live NeonDB (already applied on existing DBs)
  const migPurgeCheck = await pool.query(
    `SELECT 1 FROM schema_migrations WHERE name = '002_purge_dummy_data' LIMIT 1`
  );
  if (migPurgeCheck.rowCount === 0) {
    await pool.query(`DELETE FROM assessment_submissions`);
    await pool.query(`DELETE FROM assessments`);
    await pool.query(`DELETE FROM bk_materials`);
    await pool.query(`DELETE FROM bk_programs`);
    await pool.query(`DELETE FROM counseling_sessions`);
    await pool.query(`DELETE FROM referrals`);
    await pool.query(`DELETE FROM student_cases`);
    await pool.query(`DELETE FROM students`);
    await pool.query(`DELETE FROM teachers`);
    await pool.query(`DELETE FROM school_classes`);
    await pool.query(`DELETE FROM majors`);
    await pool.query(`DELETE FROM academic_years`);
    await pool.query(`DELETE FROM audit_logs`);
    await pool.query(
      `INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ['002_purge_dummy_data', new Date().toISOString()]
    );
  }

  // One-time migration: ensure starter login accounts exist for all 5 roles with valid hashed passwords
  const migRolesCheck = await pool.query(
    `SELECT 1 FROM schema_migrations WHERE name = '003_seed_default_role_accounts' LIMIT 1`
  );
  if (migRolesCheck.rowCount === 0) {
    for (const u of INITIAL_USERS) {
      const pw = DEFAULT_ROLE_PASSWORDS[u.id] || DEFAULT_ADMIN_PASSWORD;
      const passwordHash = hashPassword(pw);
      await pool.query(
        `INSERT INTO users (id, username, password_hash, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           password_hash = COALESCE(NULLIF(users.password_hash, ''), EXCLUDED.password_hash)`,
        [
          u.id,
          u.username,
          passwordHash,
          u.name,
          u.email,
          u.role,
          u.avatar ?? null,
          u.nipOrNisn ?? '',
          u.phone ?? '',
          u.assignedClass ?? null,
          u.gradeLevel ?? null,
          u.active,
          u.createdAt,
        ]
      );
    }
    await pool.query(
      `INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ['003_seed_default_role_accounts', new Date().toISOString()]
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
