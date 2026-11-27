// server/app.ts
import express from "express";

// server/db.ts
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { Pool } from "pg";

// src/services/mockData.ts
var INITIAL_USERS = [
  {
    id: "u-1",
    username: "admin",
    name: "Administrator BKSmart",
    email: "admin@bksmart.sch.id",
    role: "admin",
    nipOrNisn: "",
    phone: "",
    active: true,
    createdAt: "2024-01-10T08:00:00Z"
  },
  {
    id: "u-2",
    username: "gurubk",
    name: "Guru BK (Konselor)",
    email: "gurubk@bksmart.sch.id",
    role: "counselor",
    nipOrNisn: "",
    phone: "",
    active: true,
    createdAt: "2024-01-10T08:05:00Z"
  },
  {
    id: "u-3",
    username: "walikelas",
    name: "Guru / Wali Kelas",
    email: "walikelas@bksmart.sch.id",
    role: "teacher",
    nipOrNisn: "",
    phone: "",
    assignedClass: "",
    active: true,
    createdAt: "2024-01-10T08:10:00Z"
  },
  {
    id: "u-4",
    username: "siswa",
    name: "Akun Siswa",
    email: "siswa@bksmart.sch.id",
    role: "student",
    nipOrNisn: "",
    phone: "",
    assignedClass: "",
    active: true,
    createdAt: "2024-01-10T08:15:00Z"
  },
  {
    id: "u-5",
    username: "kepsek",
    name: "Kepala Sekolah",
    email: "kepsek@bksmart.sch.id",
    role: "principal",
    nipOrNisn: "",
    phone: "",
    active: true,
    createdAt: "2024-01-10T08:20:00Z"
  }
];
var INITIAL_MAJORS = [];
var INITIAL_CLASSES = [];
var INITIAL_ACADEMIC_YEARS = [];
var INITIAL_TEACHERS = [];
var INITIAL_STUDENTS = [];
var INITIAL_COUNSELING_SESSIONS = [];
var INITIAL_REFERRALS = [];
var INITIAL_CASES = [];
var INITIAL_PROGRAMS = [];
var INITIAL_ASSESSMENTS = [];
var INITIAL_SUBMISSIONS = [];
var INITIAL_MATERIALS = [];
var INITIAL_AUDIT_LOGS = [];

// server/db.ts
function getDatabaseUrl() {
  const raw = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.PG_CONNECTION_STRING;
  if (!raw) return void 0;
  let url = raw.trim();
  if (url.toLowerCase().startsWith("psql ")) {
    url = url.slice(5).trim();
  }
  if (url.startsWith("'") && url.endsWith("'") || url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1).trim();
  }
  if (!url) return void 0;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return url;
  }
}
function isNeonConfigured() {
  return Boolean(getDatabaseUrl());
}
function resetPool() {
  if (global._bksmartNeonPool) {
    global._bksmartNeonPool.end().catch(() => {
    });
    global._bksmartNeonPool = void 0;
    global._bksmartSchemaPromise = void 0;
  }
}
function getPool() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;
  if (!global._bksmartNeonPool) {
    const needsSsl = connectionString.includes("neon.tech") || connectionString.includes("sslmode=require") || process.env.NODE_ENV === "production";
    global._bksmartNeonPool = new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : void 0,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: process.env.VERCEL ? 1e4 : 3e4,
      connectionTimeoutMillis: 15e3
    });
    global._bksmartNeonPool.on("error", (err) => {
      console.error("Unexpected error on idle Neon PostgreSQL pool client:", err);
      global._bksmartNeonPool = void 0;
    });
  }
  return global._bksmartNeonPool;
}
function isTransientConnectionError(err) {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  const code = err.code || "";
  return msg.includes("connection terminated") || msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("connection error") || msg.includes("socket hang up") || code === "57P01" || code === "57P02" || code === "57P03" || code === "ECONNRESET" || code === "ETIMEDOUT";
}
async function withNeonRetry(fn) {
  const pool = await ensureNeonReady();
  if (!pool) return null;
  try {
    return await fn(pool);
  } catch (err) {
    if (isTransientConnectionError(err)) {
      console.warn("Transient NeonDB connection error, resetting pool and retrying once...");
      resetPool();
      const retryPool = await ensureNeonReady();
      if (!retryPool) return null;
      return await fn(retryPool);
    }
    throw err;
  }
}
var DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
var DEFAULT_ROLE_PASSWORDS = {
  "u-1": DEFAULT_ADMIN_PASSWORD,
  "u-2": "bk123",
  "u-3": "wali123",
  "u-4": "siswa123",
  "u-5": "kepsek123"
};
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}
function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, keyHex] = parts;
    const expected = Buffer.from(keyHex, "hex");
    const actual = scryptSync(password, salt, 64);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }
  return false;
}
var memoryStore = {
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
  auditLogs: structuredClone(INITIAL_AUDIT_LOGS)
};
var SCHEMA_SQL = `
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
async function seedInitialData(pool) {
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
      ["002_purge_dummy_data", (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
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
          u.nipOrNisn ?? "",
          u.phone ?? "",
          u.assignedClass ?? null,
          u.gradeLevel ?? null,
          u.active,
          u.createdAt
        ]
      );
    }
    await pool.query(
      `INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      ["003_seed_default_role_accounts", (/* @__PURE__ */ new Date()).toISOString()]
    );
  }
}
async function ensureNeonReady() {
  const pool = getPool();
  if (!pool) return null;
  if (!global._bksmartSchemaPromise) {
    global._bksmartSchemaPromise = (async () => {
      await pool.query(SCHEMA_SQL);
      await seedInitialData(pool);
    })().catch((err) => {
      global._bksmartSchemaPromise = void 0;
      throw err;
    });
  }
  await global._bksmartSchemaPromise;
  return pool;
}

// server/repository.ts
function sanitizeRole(roleHeader) {
  const valid = ["admin", "counselor", "teacher", "student", "principal"];
  const r = typeof roleHeader === "string" ? roleHeader.toLowerCase() : "";
  return valid.includes(r) ? r : "student";
}
var BKSmartRepository = class {
  static async getBootstrap(callerRoleHeader) {
    const callerRole = sanitizeRole(callerRoleHeader);
    const canSeeConfidential = callerRole === "counselor";
    try {
      const dbResult = await withNeonRetry(async (pool) => {
        const [
          usersRes2,
          studentsRes2,
          teachersRes2,
          classesRes2,
          majorsRes2,
          yearsRes2,
          sessionsRes2,
          referralsRes2,
          casesRes2,
          programsRes2,
          assessmentsRes2,
          submissionsRes2,
          materialsRes2,
          auditRes2
        ] = await Promise.all([
          pool.query("SELECT * FROM users ORDER BY created_at ASC"),
          pool.query("SELECT * FROM students ORDER BY id ASC"),
          pool.query("SELECT * FROM teachers ORDER BY id ASC"),
          pool.query("SELECT * FROM school_classes ORDER BY name ASC"),
          pool.query("SELECT * FROM majors ORDER BY code ASC"),
          pool.query("SELECT * FROM academic_years ORDER BY year DESC, semester DESC"),
          pool.query("SELECT * FROM counseling_sessions ORDER BY created_at DESC"),
          pool.query("SELECT * FROM referrals ORDER BY created_at DESC"),
          pool.query("SELECT * FROM student_cases ORDER BY created_at DESC"),
          pool.query("SELECT * FROM bk_programs ORDER BY id ASC"),
          pool.query("SELECT * FROM assessments ORDER BY id ASC"),
          pool.query("SELECT * FROM assessment_submissions ORDER BY submitted_at DESC"),
          pool.query("SELECT * FROM bk_materials ORDER BY created_at DESC"),
          pool.query("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100")
        ]);
        return {
          usersRes: usersRes2,
          studentsRes: studentsRes2,
          teachersRes: teachersRes2,
          classesRes: classesRes2,
          majorsRes: majorsRes2,
          yearsRes: yearsRes2,
          sessionsRes: sessionsRes2,
          referralsRes: referralsRes2,
          casesRes: casesRes2,
          programsRes: programsRes2,
          assessmentsRes: assessmentsRes2,
          submissionsRes: submissionsRes2,
          materialsRes: materialsRes2,
          auditRes: auditRes2
        };
      });
      if (!dbResult) {
        return {
          users: memoryStore.users,
          students: memoryStore.students,
          teachers: memoryStore.teachers,
          classes: memoryStore.classes,
          majors: memoryStore.majors,
          academicYears: memoryStore.academicYears,
          counselingSessions: memoryStore.counselingSessions.map(
            (s) => canSeeConfidential ? s : { ...s, confidentialNotes: void 0 }
          ),
          referrals: memoryStore.referrals,
          cases: memoryStore.cases.map(
            (c) => canSeeConfidential ? c : { ...c, confidentialDetails: void 0 }
          ),
          programs: memoryStore.programs,
          assessments: memoryStore.assessments,
          submissions: memoryStore.submissions,
          materials: memoryStore.materials,
          auditLogs: memoryStore.auditLogs
        };
      }
      const {
        usersRes,
        studentsRes,
        teachersRes,
        classesRes,
        majorsRes,
        yearsRes,
        sessionsRes,
        referralsRes,
        casesRes,
        programsRes,
        assessmentsRes,
        submissionsRes,
        materialsRes,
        auditRes
      } = dbResult;
      return {
        users: usersRes.rows.map((r) => ({
          id: r.id,
          username: r.username,
          name: r.name,
          email: r.email,
          role: r.role,
          avatar: r.avatar ?? void 0,
          nipOrNisn: r.nip_or_nisn ?? "",
          phone: r.phone ?? "",
          assignedClass: r.assigned_class ?? void 0,
          gradeLevel: r.grade_level ?? void 0,
          active: Boolean(r.active),
          createdAt: r.created_at
        })),
        students: studentsRes.rows.map((r) => ({
          id: r.id,
          nisn: r.nisn,
          nis: r.nis,
          name: r.name,
          gender: r.gender,
          classId: r.class_id,
          className: r.class_name,
          majorId: r.major_id,
          majorName: r.major_name,
          academicYear: r.academic_year,
          parentName: r.parent_name,
          parentPhone: r.parent_phone,
          studentPhone: r.student_phone,
          address: r.address,
          status: r.status,
          counselingCount: Number(r.counseling_count || 0),
          openCasesCount: Number(r.open_cases_count || 0)
        })),
        teachers: teachersRes.rows.map((r) => ({
          id: r.id,
          nip: r.nip,
          name: r.name,
          gender: r.gender,
          email: r.email,
          phone: r.phone,
          role: r.role,
          specialization: r.specialization ?? void 0,
          assignedClass: r.assigned_class ?? void 0
        })),
        classes: classesRes.rows.map((r) => ({
          id: r.id,
          name: r.name,
          grade: r.grade,
          majorId: r.major_id,
          majorName: r.major_name,
          homeroomTeacherId: r.homeroom_teacher_id ?? void 0,
          homeroomTeacherName: r.homeroom_teacher_name ?? void 0,
          studentCount: Number(r.student_count || 0),
          academicYear: r.academic_year
        })),
        majors: majorsRes.rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          headOfMajor: r.head_of_major ?? void 0
        })),
        academicYears: yearsRes.rows.map((r) => ({
          id: r.id,
          year: r.year,
          semester: r.semester,
          isActive: Boolean(r.is_active)
        })),
        counselingSessions: sessionsRes.rows.map((r) => ({
          id: r.id,
          ticketNumber: r.ticket_number,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          counselorId: r.counselor_id,
          counselorName: r.counselor_name,
          type: r.type,
          domain: r.domain,
          sessionDate: r.session_date,
          sessionTime: r.session_time,
          location: r.location,
          status: r.status,
          problemSummary: r.problem_summary,
          confidentialNotes: canSeeConfidential ? r.confidential_notes ?? "" : void 0,
          actionPlan: r.action_plan ?? "",
          outcomeSummary: r.outcome_summary ?? "",
          followUpDate: r.follow_up_date ?? void 0,
          createdAt: r.created_at
        })),
        referrals: referralsRes.rows.map((r) => ({
          id: r.id,
          referralNumber: r.referral_number,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          referredByTeacherId: r.referred_by_teacher_id,
          referredByTeacherName: r.referred_by_teacher_name,
          counselorId: r.counselor_id ?? void 0,
          counselorName: r.counselor_name ?? void 0,
          reason: r.reason,
          indicators: Array.isArray(r.indicators) ? r.indicators : [],
          urgency: r.urgency,
          status: r.status,
          counselorFeedback: r.counselor_feedback ?? "",
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })),
        cases: casesRes.rows.map((r) => ({
          id: r.id,
          caseNumber: r.case_number,
          title: r.title,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          category: r.category,
          priority: r.priority,
          status: r.status,
          assignedCounselorId: r.assigned_counselor_id,
          assignedCounselorName: r.assigned_counselor_name,
          incidentDate: r.incident_date,
          chronologySummary: r.chronology_summary,
          confidentialDetails: canSeeConfidential ? r.confidential_details ?? "" : void 0,
          interventions: Array.isArray(r.interventions) ? r.interventions : [],
          resolutionNotes: r.resolution_notes ?? "",
          createdAt: r.created_at,
          updatedAt: r.updated_at
        })),
        programs: programsRes.rows.map((r) => ({
          id: r.id,
          title: r.title,
          domain: r.domain,
          targetGrade: r.target_grade,
          semester: r.semester,
          academicYear: r.academic_year,
          objectives: r.objectives,
          scheduledMonth: r.scheduled_month,
          status: r.status,
          completionPercentage: Number(r.completion_percentage || 0)
        })),
        assessments: assessmentsRes.rows.map((r) => ({
          id: r.id,
          title: r.title,
          code: r.code,
          description: r.description,
          targetClass: r.target_class,
          questions: Array.isArray(r.questions) ? r.questions : [],
          deadline: r.deadline,
          status: r.status,
          submissionCount: Number(r.submission_count || 0),
          totalTarget: Number(r.total_target || 0)
        })),
        submissions: submissionsRes.rows.map((r) => ({
          id: r.id,
          assessmentId: r.assessment_id,
          assessmentTitle: r.assessment_title,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          submittedAt: r.submitted_at,
          answers: r.answers || {},
          resultSummary: r.result_summary || {}
        })),
        materials: materialsRes.rows.map((r) => ({
          id: r.id,
          title: r.title,
          domain: r.domain,
          targetGrade: r.target_grade,
          authorName: r.author_name,
          summary: r.summary,
          content: r.content,
          hasTask: Boolean(r.has_task),
          taskPrompt: r.task_prompt ?? "",
          createdAt: r.created_at,
          readCount: Number(r.read_count || 0)
        })),
        auditLogs: auditRes.rows.map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          userId: r.user_id,
          userName: r.user_name,
          userRole: r.user_role,
          action: r.action,
          module: r.module,
          description: r.description,
          ipAddress: r.ip_address
        }))
      };
    } catch (error) {
      console.error("Database bootstrap query failed:", error);
      throw new Error("Gagal memuat data dari database.", { cause: error });
    }
  }
  // AUTHENTICATION
  static async authenticateUser(username, password) {
    try {
      let dbRow;
      const poolHandled = await withNeonRetry(async (pool) => {
        const res = await pool.query(
          "SELECT * FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1",
          [username]
        );
        dbRow = res.rows[0];
        return true;
      });
      if (!poolHandled) {
        const found = memoryStore.users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (!found || !found.active) return null;
        const storedHash = memoryStore.userPasswords[found.id];
        if (!verifyPassword(password, storedHash)) return null;
        return found;
      }
      const r = dbRow;
      if (!r || !r.active) return null;
      if (!verifyPassword(password, String(r.password_hash || ""))) return null;
      return {
        id: String(r.id),
        username: String(r.username),
        name: String(r.name),
        email: String(r.email || ""),
        role: r.role,
        avatar: r.avatar ? String(r.avatar) : void 0,
        nipOrNisn: r.nip_or_nisn ? String(r.nip_or_nisn) : "",
        phone: r.phone ? String(r.phone) : "",
        assignedClass: r.assigned_class ? String(r.assigned_class) : void 0,
        gradeLevel: r.grade_level ? String(r.grade_level) : void 0,
        active: Boolean(r.active),
        createdAt: String(r.created_at)
      };
    } catch (error) {
      console.error("authenticateUser failed:", error);
      throw new Error("Gagal memverifikasi kredensial pengguna.", { cause: error });
    }
  }
  // USERS
  static async saveUser(user) {
    try {
      const { password, ...cleanUser } = user;
      const passwordHash = typeof password === "string" && password.trim().length > 0 ? hashPassword(password) : "";
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.users.findIndex((u) => u.id === cleanUser.id);
        if (idx !== -1) memoryStore.users[idx] = cleanUser;
        else memoryStore.users.push(cleanUser);
        if (passwordHash) {
          memoryStore.userPasswords[cleanUser.id] = passwordHash;
        }
        return cleanUser;
      }
      await pool.query(
        `INSERT INTO users (id, username, password_hash, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           password_hash = COALESCE(NULLIF(EXCLUDED.password_hash, ''), users.password_hash),
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           avatar = EXCLUDED.avatar,
           nip_or_nisn = EXCLUDED.nip_or_nisn,
           phone = EXCLUDED.phone,
           assigned_class = EXCLUDED.assigned_class,
           grade_level = EXCLUDED.grade_level,
           active = EXCLUDED.active`,
        [
          cleanUser.id,
          cleanUser.username,
          passwordHash,
          cleanUser.name,
          cleanUser.email,
          cleanUser.role,
          cleanUser.avatar ?? null,
          cleanUser.nipOrNisn ?? "",
          cleanUser.phone ?? "",
          cleanUser.assignedClass ?? null,
          cleanUser.gradeLevel ?? null,
          cleanUser.active,
          cleanUser.createdAt
        ]
      );
      return cleanUser;
    } catch (error) {
      console.error("saveUser failed:", error);
      throw new Error("Gagal menyimpan data pengguna.", { cause: error });
    }
  }
  static async importUsers(users) {
    if (users.length === 0) return;
    try {
      for (const u of users) {
        await this.saveUser(u);
      }
    } catch (error) {
      console.error("importUsers failed:", error);
      throw new Error("Gagal mengimpor akun pengguna.", { cause: error });
    }
  }
  static async deleteUsers(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.users = memoryStore.users.filter((u) => !set.has(u.id));
        return;
      }
      await pool.query("DELETE FROM users WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteUsers failed:", error);
      throw new Error("Gagal menghapus data pengguna.", { cause: error });
    }
  }
  // STUDENTS
  static async saveStudent(s) {
    const clean = {
      id: s.id,
      nisn: s.nisn ?? "",
      nis: s.nis ?? "",
      name: s.name || "Siswa Baru",
      gender: s.gender === "P" ? "P" : "L",
      classId: s.classId ?? "",
      className: s.className || "-",
      majorId: s.majorId ?? "",
      majorName: s.majorName || "-",
      academicYear: s.academicYear || `${(/* @__PURE__ */ new Date()).getFullYear()}/${(/* @__PURE__ */ new Date()).getFullYear() + 1}`,
      parentName: s.parentName ?? "-",
      parentPhone: s.parentPhone ?? "-",
      studentPhone: s.studentPhone ?? "-",
      address: s.address ?? "-",
      status: s.status || "active",
      counselingCount: Number(s.counselingCount ?? 0),
      openCasesCount: Number(s.openCasesCount ?? 0)
    };
    try {
      const result = await withNeonRetry(async (pool) => {
        await pool.query(
          `INSERT INTO students (id, nisn, nis, name, gender, class_id, class_name, major_id, major_name, academic_year, parent_name, parent_phone, student_phone, address, status, counseling_count, open_cases_count)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT (id) DO UPDATE SET
             nisn = EXCLUDED.nisn,
             nis = EXCLUDED.nis,
             name = EXCLUDED.name,
             gender = EXCLUDED.gender,
             class_id = EXCLUDED.class_id,
             class_name = EXCLUDED.class_name,
             major_id = EXCLUDED.major_id,
             major_name = EXCLUDED.major_name,
             academic_year = EXCLUDED.academic_year,
             parent_name = EXCLUDED.parent_name,
             parent_phone = EXCLUDED.parent_phone,
             student_phone = EXCLUDED.student_phone,
             address = EXCLUDED.address,
             status = EXCLUDED.status,
             counseling_count = EXCLUDED.counseling_count,
             open_cases_count = EXCLUDED.open_cases_count`,
          [
            clean.id,
            clean.nisn,
            clean.nis,
            clean.name,
            clean.gender,
            clean.classId,
            clean.className,
            clean.majorId,
            clean.majorName,
            clean.academicYear,
            clean.parentName,
            clean.parentPhone,
            clean.studentPhone,
            clean.address,
            clean.status,
            clean.counselingCount,
            clean.openCasesCount
          ]
        );
        return clean;
      });
      if (!result) {
        const idx = memoryStore.students.findIndex((x) => x.id === clean.id);
        if (idx !== -1) memoryStore.students[idx] = clean;
        else memoryStore.students.unshift(clean);
      }
      return clean;
    } catch (error) {
      console.error("saveStudent failed:", error);
      throw new Error("Gagal menyimpan data siswa ke database.", { cause: error });
    }
  }
  static async importStudents(students) {
    if (students.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        memoryStore.students = [...students, ...memoryStore.students];
        return;
      }
      for (const s of students) {
        await this.saveStudent(s);
      }
    } catch (error) {
      console.error("importStudents failed:", error);
      throw new Error("Gagal mengimpor data siswa.", { cause: error });
    }
  }
  static async deleteStudents(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.students = memoryStore.students.filter((s) => !set.has(s.id));
        return;
      }
      await pool.query("DELETE FROM students WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteStudents failed:", error);
      throw new Error("Gagal menghapus data siswa.", { cause: error });
    }
  }
  // TEACHERS
  static async saveTeacher(t) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.teachers.findIndex((x) => x.id === t.id);
        if (idx !== -1) memoryStore.teachers[idx] = t;
        else memoryStore.teachers.push(t);
        return t;
      }
      await pool.query(
        `INSERT INTO teachers (id, nip, name, gender, email, phone, role, specialization, assigned_class)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO UPDATE SET
           nip = EXCLUDED.nip,
           name = EXCLUDED.name,
           gender = EXCLUDED.gender,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           specialization = EXCLUDED.specialization,
           assigned_class = EXCLUDED.assigned_class`,
        [t.id, t.nip, t.name, t.gender, t.email, t.phone, t.role, t.specialization ?? null, t.assignedClass ?? null]
      );
      return t;
    } catch (error) {
      console.error("saveTeacher failed:", error);
      throw new Error("Gagal menyimpan data guru.", { cause: error });
    }
  }
  static async importTeachers(teachers) {
    if (teachers.length === 0) return;
    try {
      for (const t of teachers) {
        await this.saveTeacher(t);
      }
    } catch (error) {
      console.error("importTeachers failed:", error);
      throw new Error("Gagal mengimpor data guru.", { cause: error });
    }
  }
  static async deleteTeachers(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.teachers = memoryStore.teachers.filter((t) => !set.has(t.id));
        return;
      }
      await pool.query("DELETE FROM teachers WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteTeachers failed:", error);
      throw new Error("Gagal menghapus data guru.", { cause: error });
    }
  }
  // CLASSES
  static async saveClass(c) {
    const clean = {
      id: c.id,
      name: c.name || "Kelas Baru",
      grade: c.grade || "10",
      majorId: c.majorId ?? "",
      majorName: c.majorName || "-",
      homeroomTeacherId: c.homeroomTeacherId,
      homeroomTeacherName: c.homeroomTeacherName,
      studentCount: Number(c.studentCount ?? 0),
      academicYear: c.academicYear || `${(/* @__PURE__ */ new Date()).getFullYear()}/${(/* @__PURE__ */ new Date()).getFullYear() + 1}`
    };
    try {
      const result = await withNeonRetry(async (pool) => {
        const existingByName = await pool.query(
          "SELECT id FROM school_classes WHERE LOWER(name) = LOWER($1) LIMIT 1",
          [clean.name]
        );
        const targetId = existingByName.rows[0]?.id || clean.id;
        clean.id = targetId;
        await pool.query(
          `INSERT INTO school_classes (id, name, grade, major_id, major_name, homeroom_teacher_id, homeroom_teacher_name, student_count, academic_year)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             grade = EXCLUDED.grade,
             major_id = EXCLUDED.major_id,
             major_name = EXCLUDED.major_name,
             homeroom_teacher_id = EXCLUDED.homeroom_teacher_id,
             homeroom_teacher_name = EXCLUDED.homeroom_teacher_name,
             student_count = EXCLUDED.student_count,
             academic_year = EXCLUDED.academic_year`,
          [clean.id, clean.name, clean.grade, clean.majorId, clean.majorName, clean.homeroomTeacherId ?? null, clean.homeroomTeacherName ?? null, clean.studentCount, clean.academicYear]
        );
        return clean;
      });
      if (!result) {
        const idx = memoryStore.classes.findIndex((x) => x.id === clean.id);
        if (idx !== -1) memoryStore.classes[idx] = clean;
        else memoryStore.classes.push(clean);
      }
      return clean;
    } catch (error) {
      console.error("saveClass failed:", error);
      throw new Error("Gagal menyimpan data kelas.", { cause: error });
    }
  }
  static async deleteClasses(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.classes = memoryStore.classes.filter((c) => !set.has(c.id));
        return;
      }
      await pool.query("DELETE FROM school_classes WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteClasses failed:", error);
      throw new Error("Gagal menghapus data kelas.", { cause: error });
    }
  }
  // MAJORS
  static async saveMajor(m) {
    const clean = {
      id: m.id,
      code: (m.code || "JUR").trim().toUpperCase(),
      name: (m.name || "Jurusan Baru").trim(),
      headOfMajor: m.headOfMajor?.trim() || void 0
    };
    try {
      const result = await withNeonRetry(async (pool) => {
        const existingByCode = await pool.query(
          "SELECT id FROM majors WHERE UPPER(code) = UPPER($1) LIMIT 1",
          [clean.code]
        );
        const targetId = existingByCode.rows[0]?.id || clean.id;
        clean.id = targetId;
        await pool.query(
          `INSERT INTO majors (id, code, name, head_of_major)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET
             code = EXCLUDED.code,
             name = EXCLUDED.name,
             head_of_major = EXCLUDED.head_of_major`,
          [clean.id, clean.code, clean.name, clean.headOfMajor ?? null]
        );
        return clean;
      });
      if (!result) {
        const idx = memoryStore.majors.findIndex((x) => x.id === clean.id);
        if (idx !== -1) memoryStore.majors[idx] = clean;
        else memoryStore.majors.push(clean);
      }
      return clean;
    } catch (error) {
      console.error("saveMajor failed:", error);
      throw new Error("Gagal menyimpan data jurusan.", { cause: error });
    }
  }
  static async deleteMajors(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.majors = memoryStore.majors.filter((m) => !set.has(m.id));
        return;
      }
      await pool.query("DELETE FROM majors WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteMajors failed:", error);
      throw new Error("Gagal menghapus data jurusan.", { cause: error });
    }
  }
  // ACADEMIC YEARS
  static async saveAcademicYear(ay) {
    const clean = {
      id: ay.id,
      year: (ay.year || `${(/* @__PURE__ */ new Date()).getFullYear()}/${(/* @__PURE__ */ new Date()).getFullYear() + 1}`).trim(),
      semester: ay.semester === "Genap" ? "Genap" : "Ganjil",
      isActive: Boolean(ay.isActive)
    };
    try {
      const result = await withNeonRetry(async (pool) => {
        if (clean.isActive) {
          await pool.query("UPDATE academic_years SET is_active = FALSE WHERE id <> $1", [clean.id]);
        }
        await pool.query(
          `INSERT INTO academic_years (id, year, semester, is_active)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (id) DO UPDATE SET
             year = EXCLUDED.year,
             semester = EXCLUDED.semester,
             is_active = EXCLUDED.is_active`,
          [clean.id, clean.year, clean.semester, clean.isActive]
        );
        return clean;
      });
      if (!result) {
        if (clean.isActive) {
          memoryStore.academicYears = memoryStore.academicYears.map(
            (x) => x.id === clean.id ? x : { ...x, isActive: false }
          );
        }
        const idx = memoryStore.academicYears.findIndex((x) => x.id === clean.id);
        if (idx !== -1) memoryStore.academicYears[idx] = clean;
        else memoryStore.academicYears.unshift(clean);
      }
      return clean;
    } catch (error) {
      console.error("saveAcademicYear failed:", error);
      throw new Error("Gagal menyimpan data tahun ajaran.", { cause: error });
    }
  }
  static async deleteAcademicYears(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.academicYears = memoryStore.academicYears.filter((ay) => !set.has(ay.id));
        return;
      }
      await pool.query("DELETE FROM academic_years WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteAcademicYears failed:", error);
      throw new Error("Gagal menghapus data tahun ajaran.", { cause: error });
    }
  }
  static async importAcademic(payload) {
    const counts = { academicYears: 0, majors: 0, classes: 0 };
    try {
      if (Array.isArray(payload.academicYears)) {
        for (const ay of payload.academicYears) {
          if (ay?.year) {
            await this.saveAcademicYear(ay);
            counts.academicYears++;
          }
        }
      }
      if (Array.isArray(payload.majors)) {
        for (const m of payload.majors) {
          if (m?.name) {
            await this.saveMajor(m);
            counts.majors++;
          }
        }
      }
      if (Array.isArray(payload.classes)) {
        for (const c of payload.classes) {
          if (c?.name) {
            await this.saveClass(c);
            counts.classes++;
          }
        }
      }
      return counts;
    } catch (error) {
      console.error("importAcademic failed:", error);
      throw new Error("Gagal mengimpor data akademik sekolah.", { cause: error });
    }
  }
  // COUNSELING SESSIONS
  static async saveCounselingSession(cs) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.counselingSessions.findIndex((x) => x.id === cs.id);
        if (idx !== -1) memoryStore.counselingSessions[idx] = cs;
        else memoryStore.counselingSessions.unshift(cs);
        return cs;
      }
      await pool.query(
        `INSERT INTO counseling_sessions (id, ticket_number, student_id, student_name, student_class, counselor_id, counselor_name, type, domain, session_date, session_time, location, status, problem_summary, confidential_notes, action_plan, outcome_summary, follow_up_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           student_name = EXCLUDED.student_name,
           student_class = EXCLUDED.student_class,
           counselor_id = EXCLUDED.counselor_id,
           counselor_name = EXCLUDED.counselor_name,
           type = EXCLUDED.type,
           domain = EXCLUDED.domain,
           session_date = EXCLUDED.session_date,
           session_time = EXCLUDED.session_time,
           location = EXCLUDED.location,
           status = EXCLUDED.status,
           problem_summary = EXCLUDED.problem_summary,
           confidential_notes = COALESCE(NULLIF(EXCLUDED.confidential_notes, ''), counseling_sessions.confidential_notes),
           action_plan = EXCLUDED.action_plan,
           outcome_summary = EXCLUDED.outcome_summary,
           follow_up_date = EXCLUDED.follow_up_date`,
        [cs.id, cs.ticketNumber, cs.studentId, cs.studentName, cs.studentClass, cs.counselorId, cs.counselorName, cs.type, cs.domain, cs.sessionDate, cs.sessionTime, cs.location, cs.status, cs.problemSummary, cs.confidentialNotes ?? "", cs.actionPlan ?? "", cs.outcomeSummary ?? "", cs.followUpDate ?? null, cs.createdAt]
      );
      return cs;
    } catch (error) {
      console.error("saveCounselingSession failed:", error);
      throw new Error("Gagal menyimpan sesi konseling.", { cause: error });
    }
  }
  static async deleteCounselingSessions(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.counselingSessions = memoryStore.counselingSessions.filter((s) => !set.has(s.id));
        return;
      }
      await pool.query("DELETE FROM counseling_sessions WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteCounselingSessions failed:", error);
      throw new Error("Gagal menghapus sesi konseling.", { cause: error });
    }
  }
  // REFERRALS
  static async saveReferral(r) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.referrals.findIndex((x) => x.id === r.id);
        if (idx !== -1) memoryStore.referrals[idx] = r;
        else memoryStore.referrals.unshift(r);
        return r;
      }
      await pool.query(
        `INSERT INTO referrals (id, referral_number, student_id, student_name, student_class, referred_by_teacher_id, referred_by_teacher_name, counselor_id, counselor_name, reason, indicators, urgency, status, counselor_feedback, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           counselor_id = EXCLUDED.counselor_id,
           counselor_name = EXCLUDED.counselor_name,
           reason = EXCLUDED.reason,
           indicators = EXCLUDED.indicators,
           urgency = EXCLUDED.urgency,
           status = EXCLUDED.status,
           counselor_feedback = EXCLUDED.counselor_feedback,
           updated_at = EXCLUDED.updated_at`,
        [r.id, r.referralNumber, r.studentId, r.studentName, r.studentClass, r.referredByTeacherId, r.referredByTeacherName, r.counselorId ?? null, r.counselorName ?? null, r.reason, JSON.stringify(r.indicators || []), r.urgency, r.status, r.counselorFeedback ?? "", r.createdAt, r.updatedAt]
      );
      return r;
    } catch (error) {
      console.error("saveReferral failed:", error);
      throw new Error("Gagal menyimpan data rujukan.", { cause: error });
    }
  }
  static async deleteReferrals(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.referrals = memoryStore.referrals.filter((r) => !set.has(r.id));
        return;
      }
      await pool.query("DELETE FROM referrals WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteReferrals failed:", error);
      throw new Error("Gagal menghapus data rujukan.", { cause: error });
    }
  }
  // CASES
  static async saveCase(c) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.cases.findIndex((x) => x.id === c.id);
        if (idx !== -1) memoryStore.cases[idx] = c;
        else memoryStore.cases.unshift(c);
        return c;
      }
      await pool.query(
        `INSERT INTO student_cases (id, case_number, title, student_id, student_name, student_class, category, priority, status, assigned_counselor_id, assigned_counselor_name, incident_date, chronology_summary, confidential_details, interventions, resolution_notes, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,$17,$18)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           category = EXCLUDED.category,
           priority = EXCLUDED.priority,
           status = EXCLUDED.status,
           assigned_counselor_id = EXCLUDED.assigned_counselor_id,
           assigned_counselor_name = EXCLUDED.assigned_counselor_name,
           incident_date = EXCLUDED.incident_date,
           chronology_summary = EXCLUDED.chronology_summary,
           confidential_details = COALESCE(NULLIF(EXCLUDED.confidential_details, ''), student_cases.confidential_details),
           interventions = EXCLUDED.interventions,
           resolution_notes = EXCLUDED.resolution_notes,
           updated_at = EXCLUDED.updated_at`,
        [c.id, c.caseNumber, c.title, c.studentId, c.studentName, c.studentClass, c.category, c.priority, c.status, c.assignedCounselorId, c.assignedCounselorName, c.incidentDate, c.chronologySummary, c.confidentialDetails ?? "", JSON.stringify(c.interventions || []), c.resolutionNotes ?? "", c.createdAt, c.updatedAt]
      );
      return c;
    } catch (error) {
      console.error("saveCase failed:", error);
      throw new Error("Gagal menyimpan data kasus.", { cause: error });
    }
  }
  static async deleteCases(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.cases = memoryStore.cases.filter((c) => !set.has(c.id));
        return;
      }
      await pool.query("DELETE FROM student_cases WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteCases failed:", error);
      throw new Error("Gagal menghapus data kasus.", { cause: error });
    }
  }
  // PROGRAMS
  static async saveProgram(p) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.programs.findIndex((x) => x.id === p.id);
        if (idx !== -1) memoryStore.programs[idx] = p;
        else memoryStore.programs.push(p);
        return p;
      }
      await pool.query(
        `INSERT INTO bk_programs (id, title, domain, target_grade, semester, academic_year, objectives, scheduled_month, status, completion_percentage)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           domain = EXCLUDED.domain,
           target_grade = EXCLUDED.target_grade,
           semester = EXCLUDED.semester,
           academic_year = EXCLUDED.academic_year,
           objectives = EXCLUDED.objectives,
           scheduled_month = EXCLUDED.scheduled_month,
           status = EXCLUDED.status,
           completion_percentage = EXCLUDED.completion_percentage`,
        [p.id, p.title, p.domain, p.targetGrade, p.semester, p.academicYear, p.objectives, p.scheduledMonth, p.status, p.completionPercentage]
      );
      return p;
    } catch (error) {
      console.error("saveProgram failed:", error);
      throw new Error("Gagal menyimpan program BK.", { cause: error });
    }
  }
  static async deletePrograms(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.programs = memoryStore.programs.filter((p) => !set.has(p.id));
        return;
      }
      await pool.query("DELETE FROM bk_programs WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deletePrograms failed:", error);
      throw new Error("Gagal menghapus program BK.", { cause: error });
    }
  }
  // ASSESSMENTS
  static async saveSubmission(sub) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        memoryStore.submissions.unshift(sub);
        const asm = memoryStore.assessments.find((a) => a.id === sub.assessmentId);
        if (asm) asm.submissionCount += 1;
        return sub;
      }
      await pool.query(
        `INSERT INTO assessment_submissions (id, assessment_id, assessment_title, student_id, student_name, student_class, submitted_at, answers, result_summary)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [sub.id, sub.assessmentId, sub.assessmentTitle, sub.studentId, sub.studentName, sub.studentClass, sub.submittedAt, JSON.stringify(sub.answers || {}), JSON.stringify(sub.resultSummary || {})]
      );
      await pool.query(
        "UPDATE assessments SET submission_count = submission_count + 1 WHERE id = $1",
        [sub.assessmentId]
      );
      return sub;
    } catch (error) {
      console.error("saveSubmission failed:", error);
      throw new Error("Gagal menyimpan hasil asesmen.", { cause: error });
    }
  }
  // MATERIALS
  static async saveMaterial(m) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.materials.findIndex((x) => x.id === m.id);
        if (idx !== -1) memoryStore.materials[idx] = m;
        else memoryStore.materials.unshift(m);
        return m;
      }
      await pool.query(
        `INSERT INTO bk_materials (id, title, domain, target_grade, author_name, summary, content, has_task, task_prompt, created_at, read_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           domain = EXCLUDED.domain,
           target_grade = EXCLUDED.target_grade,
           author_name = EXCLUDED.author_name,
           summary = EXCLUDED.summary,
           content = EXCLUDED.content,
           has_task = EXCLUDED.has_task,
           task_prompt = EXCLUDED.task_prompt,
           read_count = EXCLUDED.read_count`,
        [m.id, m.title, m.domain, m.targetGrade, m.authorName, m.summary, m.content, m.hasTask, m.taskPrompt ?? "", m.createdAt, m.readCount]
      );
      return m;
    } catch (error) {
      console.error("saveMaterial failed:", error);
      throw new Error("Gagal menyimpan materi BK.", { cause: error });
    }
  }
  static async deleteMaterials(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.materials = memoryStore.materials.filter((m) => !set.has(m.id));
        return;
      }
      await pool.query("DELETE FROM bk_materials WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteMaterials failed:", error);
      throw new Error("Gagal menghapus materi BK.", { cause: error });
    }
  }
  // AUDIT LOGS
  static async addAuditLog(log) {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        memoryStore.auditLogs.unshift(log);
        memoryStore.auditLogs = memoryStore.auditLogs.slice(0, 100);
        return log;
      }
      await pool.query(
        `INSERT INTO audit_logs (id, timestamp, user_id, user_name, user_role, action, module, description, ip_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.timestamp, log.userId, log.userName, log.userRole, log.action, log.module, log.description, log.ipAddress]
      );
      return log;
    } catch (error) {
      console.error("addAuditLog failed:", error);
      throw new Error("Gagal mencatat audit log.", { cause: error });
    }
  }
  static async deleteAuditLogs(ids) {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.auditLogs = memoryStore.auditLogs.filter((l) => !set.has(l.id));
        return;
      }
      await pool.query("DELETE FROM audit_logs WHERE id = ANY($1::text[])", [ids]);
    } catch (error) {
      console.error("deleteAuditLogs failed:", error);
      throw new Error("Gagal menghapus audit log.", { cause: error });
    }
  }
  // ADMIN BACKUP & RESTORE
  static async createBackupSnapshot() {
    const data = await this.getBootstrap("counselor");
    return {
      meta: {
        app: "BKSmart",
        version: "1.0",
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      data
    };
  }
  static async restoreBackupSnapshot(payload) {
    const data = payload?.data && typeof payload.data === "object" ? payload.data : payload;
    const counts = {
      users: 0,
      majors: 0,
      academicYears: 0,
      teachers: 0,
      classes: 0,
      students: 0,
      counselingSessions: 0,
      referrals: 0,
      cases: 0,
      programs: 0,
      materials: 0
    };
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (u?.id && u?.username) {
          await this.saveUser(u);
          counts.users++;
        }
      }
    }
    if (Array.isArray(data.majors)) {
      for (const m of data.majors) {
        if (m?.id && m?.name) {
          await this.saveMajor(m);
          counts.majors++;
        }
      }
    }
    if (Array.isArray(data.academicYears)) {
      for (const ay of data.academicYears) {
        if (ay?.id && ay?.year) {
          await this.saveAcademicYear(ay);
          counts.academicYears++;
        }
      }
    }
    if (Array.isArray(data.teachers)) {
      for (const t of data.teachers) {
        if (t?.id && t?.name) {
          await this.saveTeacher(t);
          counts.teachers++;
        }
      }
    }
    if (Array.isArray(data.classes)) {
      for (const c of data.classes) {
        if (c?.id && c?.name) {
          await this.saveClass(c);
          counts.classes++;
        }
      }
    }
    if (Array.isArray(data.students)) {
      for (const s of data.students) {
        if (s?.id && s?.name) {
          await this.saveStudent(s);
          counts.students++;
        }
      }
    }
    if (Array.isArray(data.counselingSessions)) {
      for (const cs of data.counselingSessions) {
        if (cs?.id && cs?.ticketNumber) {
          await this.saveCounselingSession(cs);
          counts.counselingSessions++;
        }
      }
    }
    if (Array.isArray(data.referrals)) {
      for (const r of data.referrals) {
        if (r?.id && r?.referralNumber) {
          await this.saveReferral(r);
          counts.referrals++;
        }
      }
    }
    if (Array.isArray(data.cases)) {
      for (const c of data.cases) {
        if (c?.id && c?.caseNumber) {
          await this.saveCase(c);
          counts.cases++;
        }
      }
    }
    if (Array.isArray(data.programs)) {
      for (const p of data.programs) {
        if (p?.id && p?.title) {
          await this.saveProgram(p);
          counts.programs++;
        }
      }
    }
    if (Array.isArray(data.materials)) {
      for (const m of data.materials) {
        if (m?.id && m?.title) {
          await this.saveMaterial(m);
          counts.materials++;
        }
      }
    }
    return counts;
  }
};

// server/app.ts
function createApiApp() {
  const app2 = express();
  const jsonParser = express.json({ limit: "5mb" });
  app2.use((req, res, next) => {
    if (req.body !== void 0 && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      return next();
    }
    if (req.readable === false && req.body !== void 0) {
      return next();
    }
    return jsonParser(req, res, next);
  });
  app2.get("/api/health", async (_req, res) => {
    try {
      const pool = await ensureNeonReady();
      if (pool) {
        const countRes = await pool.query(
          "SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'"
        );
        res.json({
          status: "ok",
          database: "neondb",
          connected: true,
          tablesCount: countRes.rows[0]?.count ?? 0
        });
        return;
      }
      res.json({
        status: "ok",
        database: "memory_fallback",
        connected: true,
        configured: false
      });
    } catch (error) {
      console.error("Health check database error:", error);
      res.status(503).json({
        status: "error",
        database: isNeonConfigured() ? "neondb" : "memory_fallback",
        connected: false,
        message: error instanceof Error ? error.message : "Koneksi database belum siap."
      });
    }
  });
  app2.get("/api/bootstrap", async (req, res) => {
    try {
      const roleHeader = req.headers["x-user-role"];
      const data = await BKSmartRepository.getBootstrap(roleHeader);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
      const password = typeof req.body?.password === "string" ? req.body.password : "";
      if (!username || !password) {
        res.status(400).json({ error: "Username dan kata sandi wajib diisi." });
        return;
      }
      const user = await BKSmartRepository.authenticateUser(username, password);
      if (!user) {
        res.status(401).json({ error: "Username atau kata sandi tidak sesuai." });
        return;
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal memproses login" });
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveUser(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan pengguna" });
    }
  });
  app2.post("/api/users/import", async (req, res) => {
    try {
      const users = Array.isArray(req.body?.users) ? req.body.users : [];
      await BKSmartRepository.importUsers(users);
      res.json({ ok: true, count: users.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal mengimpor akun pengguna" });
    }
  });
  app2.delete("/api/users/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteUsers([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus pengguna" });
    }
  });
  app2.post("/api/users/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteUsers(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus pengguna terpilih" });
    }
  });
  app2.post("/api/students", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveStudent(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan siswa" });
    }
  });
  app2.post("/api/students/import", async (req, res) => {
    try {
      const students = Array.isArray(req.body?.students) ? req.body.students : [];
      await BKSmartRepository.importStudents(students);
      res.json({ ok: true, count: students.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal mengimpor siswa" });
    }
  });
  app2.delete("/api/students/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteStudents([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus siswa" });
    }
  });
  app2.post("/api/students/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteStudents(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus siswa terpilih" });
    }
  });
  app2.post("/api/teachers", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveTeacher(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan guru" });
    }
  });
  app2.post("/api/teachers/import", async (req, res) => {
    try {
      const teachers = Array.isArray(req.body?.teachers) ? req.body.teachers : [];
      await BKSmartRepository.importTeachers(teachers);
      res.json({ ok: true, count: teachers.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal mengimpor guru" });
    }
  });
  app2.delete("/api/teachers/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteTeachers([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus guru" });
    }
  });
  app2.post("/api/teachers/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteTeachers(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus guru terpilih" });
    }
  });
  app2.post("/api/classes", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveClass(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan kelas" });
    }
  });
  app2.delete("/api/classes/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteClasses([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus kelas" });
    }
  });
  app2.post("/api/classes/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteClasses(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus kelas terpilih" });
    }
  });
  app2.post("/api/majors", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveMajor(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan jurusan" });
    }
  });
  app2.delete("/api/majors/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteMajors([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus jurusan" });
    }
  });
  app2.post("/api/academic-years", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveAcademicYear(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan tahun ajaran" });
    }
  });
  app2.delete("/api/academic-years/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteAcademicYears([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus tahun ajaran" });
    }
  });
  app2.post("/api/academic/import", async (req, res) => {
    try {
      const counts = await BKSmartRepository.importAcademic({
        academicYears: Array.isArray(req.body?.academicYears) ? req.body.academicYears : [],
        majors: Array.isArray(req.body?.majors) ? req.body.majors : [],
        classes: Array.isArray(req.body?.classes) ? req.body.classes : []
      });
      res.json({ ok: true, counts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal mengimpor data akademik" });
    }
  });
  app2.post("/api/counseling-sessions", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveCounselingSession(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan sesi konseling" });
    }
  });
  app2.delete("/api/counseling-sessions/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteCounselingSessions([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus sesi konseling" });
    }
  });
  app2.post("/api/counseling-sessions/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteCounselingSessions(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus sesi konseling terpilih" });
    }
  });
  app2.post("/api/referrals", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveReferral(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan rujukan" });
    }
  });
  app2.delete("/api/referrals/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteReferrals([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus rujukan" });
    }
  });
  app2.post("/api/referrals/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteReferrals(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus rujukan terpilih" });
    }
  });
  app2.post("/api/cases", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveCase(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan kasus" });
    }
  });
  app2.delete("/api/cases/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteCases([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus kasus" });
    }
  });
  app2.post("/api/cases/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteCases(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus kasus terpilih" });
    }
  });
  app2.post("/api/programs", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveProgram(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan program BK" });
    }
  });
  app2.delete("/api/programs/:id", async (req, res) => {
    try {
      await BKSmartRepository.deletePrograms([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus program BK" });
    }
  });
  app2.post("/api/programs/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deletePrograms(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus program BK terpilih" });
    }
  });
  app2.post("/api/assessments/submit", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveSubmission(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan jawaban asesmen" });
    }
  });
  app2.post("/api/materials", async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveMaterial(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menyimpan materi BK" });
    }
  });
  app2.delete("/api/materials/:id", async (req, res) => {
    try {
      await BKSmartRepository.deleteMaterials([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus materi BK" });
    }
  });
  app2.post("/api/materials/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteMaterials(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus materi BK terpilih" });
    }
  });
  app2.post("/api/audit-logs", async (req, res) => {
    try {
      const saved = await BKSmartRepository.addAuditLog(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal mencatat audit log" });
    }
  });
  app2.post("/api/audit-logs/batch-delete", async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteAuditLogs(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal menghapus audit log terpilih" });
    }
  });
  app2.get("/api/admin/backup", async (req, res) => {
    try {
      const roleHeader = String(req.headers["x-user-role"] || "").toLowerCase();
      if (roleHeader && roleHeader !== "admin") {
        res.status(403).json({ error: "Hanya Admin yang dapat membuat backup penuh database." });
        return;
      }
      const snapshot = await BKSmartRepository.createBackupSnapshot();
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal membuat backup database" });
    }
  });
  app2.post("/api/admin/restore", async (req, res) => {
    try {
      const roleHeader = String(req.headers["x-user-role"] || "").toLowerCase();
      if (roleHeader && roleHeader !== "admin") {
        res.status(403).json({ error: "Hanya Admin yang dapat melakukan restore database." });
        return;
      }
      const counts = await BKSmartRepository.restoreBackupSnapshot(req.body || {});
      res.json({ ok: true, counts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Gagal memulihkan database dari backup" });
    }
  });
  app2.use("/api", (err, _req, res, _next) => {
    console.error("Unhandled API middleware error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Terjadi kesalahan internal server API."
    });
  });
  return app2;
}

// server/vercel.ts
var app = createApiApp();
function handler(req, res) {
  if (req.url) {
    try {
      const parsed = new URL(req.url, "http://localhost");
      const apiPath = parsed.searchParams.get("__api_path");
      if (apiPath !== null) {
        parsed.searchParams.delete("__api_path");
        const qs = parsed.searchParams.toString();
        const normalized = apiPath.replace(/^\/+/, "");
        req.url = `/api/${normalized}${qs ? `?${qs}` : ""}`;
      } else if (!req.url.startsWith("/api")) {
        req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
      }
    } catch {
    }
  }
  return app(req, res);
}
export {
  handler as default
};
