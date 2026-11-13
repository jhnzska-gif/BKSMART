export type UserRole = 'admin' | 'counselor' | 'teacher' | 'student' | 'principal';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  nipOrNisn?: string;
  phone?: string;
  assignedClass?: string; // For Wali Kelas / Teacher
  gradeLevel?: string;   // For Student
  active: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  gender: 'L' | 'P';
  classId: string;
  className: string;
  majorId: string;
  majorName: string;
  academicYear: string;
  parentName: string;
  parentPhone: string;
  studentPhone: string;
  address: string;
  status: 'active' | 'graduated' | 'transferred';
  counselingCount?: number;
  openCasesCount?: number;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  gender: 'L' | 'P';
  email: string;
  phone: string;
  role: 'teacher' | 'counselor';
  specialization?: string; // For Guru BK e.g. "Bimbingan Karier & Pribadi"
  assignedClass?: string;  // Wali kelas
}

export interface SchoolClass {
  id: string;
  name: string; // e.g. "X RPL 1"
  grade: '10' | '11' | '12';
  majorId: string;
  majorName: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  studentCount: number;
  academicYear: string;
}

export interface Major {
  id: string;
  code: string; // e.g. "RPL", "TKJ", "DKV", "AKL"
  name: string; // e.g. "Rekayasa Perangkat Lunak"
  headOfMajor?: string;
}

export interface AcademicYear {
  id: string;
  year: string; // e.g. "2024/2025"
  semester: 'Ganjil' | 'Genap';
  isActive: boolean;
}

// Counseling Services
export type CounselingType = 'individual' | 'group' | 'classical' | 'home_visit';
export type GuidanceDomain = 'pribadi' | 'sosial' | 'belajar' | 'karier';
export type CounselingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'follow_up';

export interface CounselingSession {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  counselorId: string;
  counselorName: string;
  type: CounselingType;
  domain: GuidanceDomain;
  sessionDate: string;
  sessionTime: string;
  location: string;
  status: CounselingStatus;
  problemSummary: string; // Ringkasan umum (dapat dilihat berwenang)
  confidentialNotes?: string; // Catatan privat rahasia Guru BK (RESTRICTED!)
  actionPlan?: string;    // Rencana tindak lanjut
  outcomeSummary?: string; // Hasil yang dicapai
  followUpDate?: string;
  createdAt: string;
}

// Referral / Rujukan
export type ReferralStatus = 'pending' | 'accepted' | 'scheduled' | 'resolved' | 'declined';

export interface Referral {
  id: string;
  referralNumber: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  referredByTeacherId: string;
  referredByTeacherName: string;
  counselorId?: string;
  counselorName?: string;
  reason: string;
  indicators: string[]; // e.g. ["Penurunan Prestasi", "Sering Terlambat", "Menarik Diri"]
  urgency: 'low' | 'medium' | 'high';
  status: ReferralStatus;
  counselorFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Student Cases (Bimbingan Kasus)
export type CaseCategory = 'kedisiplinan' | 'akademik' | 'sosial_perilaku' | 'emosional_pribadi' | 'keluarga' | 'bullying' | 'lainnya';
export type CasePriority = 'rendah' | 'sedang' | 'tinggi' | 'darurat';
export type CaseStatus = 'investigasi' | 'penanganan' | 'tindak_lanjut' | 'selesai';

export interface StudentCase {
  id: string;
  caseNumber: string;
  title: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  category: CaseCategory;
  priority: CasePriority;
  status: CaseStatus;
  assignedCounselorId: string;
  assignedCounselorName: string;
  incidentDate: string;
  chronologySummary: string; // Ringkasan umum
  confidentialDetails?: string; // Detail privat hanya untuk Guru BK
  interventions: {
    date: string;
    action: string;
    by: string;
    result: string;
  }[];
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// BK Programs
export interface BKProgram {
  id: string;
  title: string;
  domain: GuidanceDomain;
  targetGrade: 'Semua' | '10' | '11' | '12';
  semester: 'Ganjil' | 'Genap' | 'Tahunan';
  academicYear: string;
  objectives: string;
  scheduledMonth: string;
  status: 'planned' | 'in_progress' | 'completed';
  completionPercentage: number;
}

// Assessment / Kuesioner
export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'scale' | 'multiple_choice';
  options?: { value: string; label: string; score?: number }[];
}

export interface Assessment {
  id: string;
  title: string;
  code: string; // e.g. "AKPD-2025", "GAYA-BELAJAR-VAK"
  description: string;
  targetClass: string; // e.g. "Semua Kelas X"
  questions: AssessmentQuestion[];
  deadline: string;
  status: 'active' | 'closed';
  submissionCount: number;
  totalTarget: number;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  answers: Record<string, string>;
  resultSummary: {
    dominantType?: string; // e.g. "Visual (45%)", "Belajar Mandiri"
    needsAnalysis?: string[];
    counselorRecommendation?: string;
  };
}

// BK Material
export interface BKMaterial {
  id: string;
  title: string;
  domain: GuidanceDomain;
  targetGrade: string;
  authorName: string;
  summary: string;
  content: string;
  hasTask: boolean;
  taskPrompt?: string;
  createdAt: string;
  readCount: number;
}

// Audit Log
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "LOGIN", "VIEW_CONFIDENTIAL_CASE", "EXPORT_REPORT", "CREATE_COUNSELING"
  module: 'AUTH' | 'COUNSELING' | 'CASES' | 'STUDENTS' | 'REFERRALS' | 'REPORTS' | 'SYSTEM';
  description: string;
  ipAddress: string;
}
