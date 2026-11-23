import type {
  User, Student, Teacher, SchoolClass, Major, AcademicYear,
  CounselingSession, Referral, StudentCase, BKProgram,
  Assessment, AssessmentSubmission, BKMaterial, AuditLog
} from '../types/index.ts';

// Only the default Administrator account is pre-seeded; all operational school data starts empty.
export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    username: 'admin',
    name: 'Administrator BKSmart',
    email: 'admin@bksmart.sch.id',
    role: 'admin',
    nipOrNisn: '',
    phone: '',
    active: true,
    createdAt: '2024-01-10T08:00:00Z',
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
