import type {
  User, Student, Teacher, SchoolClass, Major, AcademicYear,
  CounselingSession, Referral, StudentCase, BKProgram,
  Assessment, AssessmentSubmission, BKMaterial, AuditLog
} from '../types/index.ts';

// 5 default role access accounts (Admin can edit/replace with real names & passwords anytime);
// all operational school data starts empty so schools can input real data without dummy records.
export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    username: 'admin',
    name: 'Kusnadi, S.Kom.',
    email: 'admin@bksmart.sch.id',
    role: 'admin',
    nipOrNisn: '',
    phone: '',
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'u-bk-2',
    username: 'anitri',
    name: 'Ani Tri Astuti, S.Pd.',
    email: 'anitri@bksmart.sch.id',
    role: 'counselor',
    nipOrNisn: '',
    phone: '',
    active: true,
    createdAt: '2024-01-10T08:05:00Z',
  },
  {
    id: 'u-bk-1',
    username: 'ciknoni',
    name: 'Dra. Cik Noni',
    email: 'ciknoni@bksmart.sch.id',
    role: 'counselor',
    nipOrNisn: '',
    phone: '',
    active: true,
    createdAt: '2024-01-10T08:06:00Z',
  },
  {
    id: 'u-5',
    username: 'kepsek',
    name: 'Osda Ida Perida Manurung, M.Pd.',
    email: 'osda.manurung@sekolah.sch.id',
    role: 'principal',
    nipOrNisn: '198001012008012001',
    phone: '',
    active: true,
    createdAt: '2024-01-10T08:20:00Z',
  },
];

export const INITIAL_MAJORS: Major[] = [];

export const INITIAL_CLASSES: SchoolClass[] = [];

export const INITIAL_ACADEMIC_YEARS: AcademicYear[] = [];

export const INITIAL_TEACHERS: Teacher[] = [];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_COUNSELING_SESSIONS: CounselingSession[] = [];

export const INITIAL_REFERRALS: Referral[] = [];

export const INITIAL_CASES: StudentCase[] = [];

export const INITIAL_PROGRAMS: BKProgram[] = [];

export const INITIAL_ASSESSMENTS: Assessment[] = [];

export const INITIAL_SUBMISSIONS: AssessmentSubmission[] = [];

export const INITIAL_MATERIALS: BKMaterial[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
