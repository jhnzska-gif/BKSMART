import {
  User, Student, Teacher, SchoolClass, Major, AcademicYear,
  CounselingSession, Referral, StudentCase, BKProgram,
  Assessment, AssessmentSubmission, BKMaterial, AuditLog, UserRole
} from '../types';
import {
  INITIAL_USERS, INITIAL_STUDENTS, INITIAL_TEACHERS, INITIAL_CLASSES,
  INITIAL_MAJORS, INITIAL_ACADEMIC_YEARS, INITIAL_COUNSELING_SESSIONS,
  INITIAL_REFERRALS, INITIAL_CASES, INITIAL_PROGRAMS, INITIAL_ASSESSMENTS,
  INITIAL_SUBMISSIONS, INITIAL_MATERIALS, INITIAL_AUDIT_LOGS
} from './mockData';

interface ClientStore {
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

const cloneDefaults = (): ClientStore => ({
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
});

let store: ClientStore = cloneDefaults();
let activeRole: UserRole = 'student';

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export class APIService {
  static setActiveRole(role: UserRole): void {
    activeRole = role;
  }

  static async syncFromServer(role?: UserRole): Promise<void> {
    if (role) {
      activeRole = role;
    }
    try {
      const response = await fetch('/api/bootstrap', {
        method: 'GET',
        headers: {
          'x-user-role': activeRole,
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Bootstrap HTTP ${response.status}`);
      }
      const data = await response.json();
      store = {
        users: Array.isArray(data.users) ? data.users : store.users,
        students: Array.isArray(data.students) ? data.students : store.students,
        teachers: Array.isArray(data.teachers) ? data.teachers : store.teachers,
        classes: Array.isArray(data.classes) ? data.classes : store.classes,
        majors: Array.isArray(data.majors) ? data.majors : store.majors,
        academicYears: Array.isArray(data.academicYears) ? data.academicYears : store.academicYears,
        counselingSessions: Array.isArray(data.counselingSessions)
          ? data.counselingSessions
          : store.counselingSessions,
        referrals: Array.isArray(data.referrals) ? data.referrals : store.referrals,
        cases: Array.isArray(data.cases) ? data.cases : store.cases,
        programs: Array.isArray(data.programs) ? data.programs : store.programs,
        assessments: Array.isArray(data.assessments) ? data.assessments : store.assessments,
        submissions: Array.isArray(data.submissions) ? data.submissions : store.submissions,
        materials: Array.isArray(data.materials) ? data.materials : store.materials,
        auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : store.auditLogs,
      };
    } catch (error) {
      console.error('Failed to sync data from backend API:', error);
    }
  }

  private static persist(url: string, method: 'POST' | 'DELETE', body?: unknown): void {
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': activeRole,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) {
          console.error(`API request failed [${method} ${url}]: HTTP ${res.status}`);
        }
      })
      .catch((err) => {
        console.error(`API request error [${method} ${url}]:`, err);
      });
  }

  // Audit logger
  static logAudit(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    module: AuditLog['module'],
    description: string
  ) {
    const newLog: AuditLog = {
      id: makeId('log'),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      module,
      description,
      ipAddress: '127.0.0.1 (Web Portal)',
    };
    store.auditLogs = [newLog, ...store.auditLogs].slice(0, 100);
    this.persist('/api/audit-logs', 'POST', newLog);
  }

  static getAuditLogs(): AuditLog[] {
    return store.auditLogs;
  }

  static deleteMultipleAuditLogs(ids: string[]): void {
    const idSet = new Set(ids);
    store.auditLogs = store.auditLogs.filter((l) => !idSet.has(l.id));
    this.persist('/api/audit-logs/batch-delete', 'POST', { ids });
  }

  // USERS
  static getUsers(): User[] {
    return store.users;
  }

  static saveUser(user: Partial<User> & { id?: string }): User {
    if (user.id) {
      const idx = store.users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        const updated = { ...store.users[idx], ...user } as User;
        store.users[idx] = updated;
        this.persist('/api/users', 'POST', updated);
        return updated;
      }
    }
    const newUser: User = {
      id: makeId('u'),
      username: user.username || 'user' + Math.floor(Math.random() * 1000),
      name: user.name || 'Pengguna Baru',
      email: user.email || '',
      role: user.role || 'student',
      active: user.active ?? true,
      nipOrNisn: user.nipOrNisn || '',
      phone: user.phone || '',
      assignedClass: user.assignedClass,
      gradeLevel: user.gradeLevel,
      createdAt: new Date().toISOString(),
    };
    store.users = [...store.users, newUser];
    this.persist('/api/users', 'POST', newUser);
    return newUser;
  }

  static deleteUser(id: string): void {
    store.users = store.users.filter((u) => u.id !== id);
    this.persist(`/api/users/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleUsers(ids: string[]): void {
    const idSet = new Set(ids);
    store.users = store.users.filter((u) => !idSet.has(u.id));
    this.persist('/api/users/batch-delete', 'POST', { ids });
  }

  // STUDENTS
  static getStudents(): Student[] {
    return store.students;
  }

  static saveStudent(student: Partial<Student> & { id?: string }): Student {
    if (student.id) {
      const idx = store.students.findIndex((s) => s.id === student.id);
      if (idx !== -1) {
        const updated = { ...store.students[idx], ...student } as Student;
        store.students[idx] = updated;
        this.persist('/api/students', 'POST', updated);
        return updated;
      }
    }
    const newStudent: Student = {
      id: makeId('s'),
      nisn: student.nisn || '00' + Math.floor(10000000 + Math.random() * 90000000),
      nis: student.nis || '24' + Math.floor(10000 + Math.random() * 90000),
      name: student.name || 'Siswa Baru',
      gender: student.gender || 'L',
      classId: student.classId || 'c-1',
      className: student.className || 'X RPL 1',
      majorId: student.majorId || 'm-1',
      majorName: student.majorName || 'Rekayasa Perangkat Lunak',
      academicYear: student.academicYear || '2024/2025',
      parentName: student.parentName || '-',
      parentPhone: student.parentPhone || '-',
      studentPhone: student.studentPhone || '-',
      address: student.address || '-',
      status: student.status || 'active',
      counselingCount: student.counselingCount ?? 0,
      openCasesCount: student.openCasesCount ?? 0,
    };
    store.students = [newStudent, ...store.students];
    this.persist('/api/students', 'POST', newStudent);
    return newStudent;
  }

  static deleteStudent(id: string): void {
    store.students = store.students.filter((s) => s.id !== id);
    this.persist(`/api/students/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleStudents(ids: string[]): void {
    const idSet = new Set(ids);
    store.students = store.students.filter((s) => !idSet.has(s.id));
    this.persist('/api/students/batch-delete', 'POST', { ids });
  }

  // TEACHERS
  static getTeachers(): Teacher[] {
    return store.teachers;
  }

  static saveTeacher(teacher: Partial<Teacher> & { id?: string }): Teacher {
    if (teacher.id) {
      const idx = store.teachers.findIndex((t) => t.id === teacher.id);
      if (idx !== -1) {
        const updated = { ...store.teachers[idx], ...teacher } as Teacher;
        store.teachers[idx] = updated;
        this.persist('/api/teachers', 'POST', updated);
        return updated;
      }
    }
    const newTeacher: Teacher = {
      id: makeId('t'),
      nip: teacher.nip || '199' + Math.floor(100000000000 + Math.random() * 900000000000),
      name: teacher.name || 'Guru Baru',
      gender: teacher.gender || 'L',
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.role || 'teacher',
      specialization: teacher.specialization,
      assignedClass: teacher.assignedClass,
    };
    store.teachers = [...store.teachers, newTeacher];
    this.persist('/api/teachers', 'POST', newTeacher);
    return newTeacher;
  }

  static deleteTeacher(id: string): void {
    store.teachers = store.teachers.filter((t) => t.id !== id);
    this.persist(`/api/teachers/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleTeachers(ids: string[]): void {
    const idSet = new Set(ids);
    store.teachers = store.teachers.filter((t) => !idSet.has(t.id));
    this.persist('/api/teachers/batch-delete', 'POST', { ids });
  }

  // CLASSES & MAJORS & ACADEMIC YEARS
  static getClasses(): SchoolClass[] {
    return store.classes;
  }

  static saveClass(item: Partial<SchoolClass> & { id?: string }): SchoolClass {
    if (item.id) {
      const idx = store.classes.findIndex((c) => c.id === item.id);
      if (idx !== -1) {
        const updated = { ...store.classes[idx], ...item } as SchoolClass;
        store.classes[idx] = updated;
        this.persist('/api/classes', 'POST', updated);
        return updated;
      }
    }
    const newClass: SchoolClass = {
      id: makeId('c'),
      name: item.name || 'Kelas Baru',
      grade: item.grade || '10',
      majorId: item.majorId || 'm-1',
      majorName: item.majorName || 'Rekayasa Perangkat Lunak',
      studentCount: item.studentCount || 0,
      academicYear: item.academicYear || '2024/2025',
      homeroomTeacherId: item.homeroomTeacherId,
      homeroomTeacherName: item.homeroomTeacherName,
    };
    store.classes = [...store.classes, newClass];
    this.persist('/api/classes', 'POST', newClass);
    return newClass;
  }

  static deleteClass(id: string): void {
    store.classes = store.classes.filter((c) => c.id !== id);
    this.persist(`/api/classes/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleClasses(ids: string[]): void {
    const idSet = new Set(ids);
    store.classes = store.classes.filter((c) => !idSet.has(c.id));
    this.persist('/api/classes/batch-delete', 'POST', { ids });
  }

  static getMajors(): Major[] {
    return store.majors;
  }

  static getAcademicYears(): AcademicYear[] {
    return store.academicYears;
  }

  // COUNSELING SESSIONS
  static getCounselingSessions(): CounselingSession[] {
    return store.counselingSessions;
  }

  static saveCounselingSession(session: Partial<CounselingSession> & { id?: string }): CounselingSession {
    if (session.id) {
      const idx = store.counselingSessions.findIndex((s) => s.id === session.id);
      if (idx !== -1) {
        const updated = { ...store.counselingSessions[idx], ...session } as CounselingSession;
        store.counselingSessions[idx] = updated;
        this.persist('/api/counseling-sessions', 'POST', updated);
        return updated;
      }
    }
    const count = store.counselingSessions.length + 1;
    const newSession: CounselingSession = {
      id: makeId('cs'),
      ticketNumber: `BK-2025-${String(count).padStart(3, '0')}`,
      studentId: session.studentId || 's-1',
      studentName: session.studentName || 'Siswa',
      studentClass: session.studentClass || 'XI RPL 1',
      counselorId: session.counselorId || 'u-2',
      counselorName: session.counselorName || 'Siti Rahmawati, S.Pd., Kons.',
      type: session.type || 'individual',
      domain: session.domain || 'pribadi',
      sessionDate: session.sessionDate || new Date().toISOString().split('T')[0],
      sessionTime: session.sessionTime || '10:00',
      location: session.location || 'Ruang BK - Konseling Individu 1',
      status: session.status || 'scheduled',
      problemSummary: session.problemSummary || 'Konsultasi BK',
      confidentialNotes: session.confidentialNotes || '',
      actionPlan: session.actionPlan || '',
      outcomeSummary: session.outcomeSummary || '',
      followUpDate: session.followUpDate,
      createdAt: new Date().toISOString(),
    };
    store.counselingSessions = [newSession, ...store.counselingSessions];
    this.persist('/api/counseling-sessions', 'POST', newSession);
    return newSession;
  }

  static deleteCounselingSession(id: string): void {
    store.counselingSessions = store.counselingSessions.filter((s) => s.id !== id);
    this.persist(`/api/counseling-sessions/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleCounselingSessions(ids: string[]): void {
    const idSet = new Set(ids);
    store.counselingSessions = store.counselingSessions.filter((s) => !idSet.has(s.id));
    this.persist('/api/counseling-sessions/batch-delete', 'POST', { ids });
  }

  // REFERRALS
  static getReferrals(): Referral[] {
    return store.referrals;
  }

  static saveReferral(ref: Partial<Referral> & { id?: string }): Referral {
    if (ref.id) {
      const idx = store.referrals.findIndex((r) => r.id === ref.id);
      if (idx !== -1) {
        const updated = {
          ...store.referrals[idx],
          ...ref,
          updatedAt: new Date().toISOString(),
        } as Referral;
        store.referrals[idx] = updated;
        this.persist('/api/referrals', 'POST', updated);
        return updated;
      }
    }
    const count = store.referrals.length + 1;
    const newRef: Referral = {
      id: makeId('ref'),
      referralNumber: `RUJ-2025-${String(count).padStart(2, '0')}`,
      studentId: ref.studentId || '',
      studentName: ref.studentName || '',
      studentClass: ref.studentClass || '',
      referredByTeacherId: ref.referredByTeacherId || 'u-3',
      referredByTeacherName: ref.referredByTeacherName || 'Wali Kelas',
      counselorId: ref.counselorId || 'u-2',
      counselorName: ref.counselorName || 'Siti Rahmawati, S.Pd., Kons.',
      reason: ref.reason || '',
      indicators: ref.indicators || [],
      urgency: ref.urgency || 'medium',
      status: ref.status || 'pending',
      counselorFeedback: ref.counselorFeedback || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.referrals = [newRef, ...store.referrals];
    this.persist('/api/referrals', 'POST', newRef);
    return newRef;
  }

  static deleteReferral(id: string): void {
    store.referrals = store.referrals.filter((r) => r.id !== id);
    this.persist(`/api/referrals/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleReferrals(ids: string[]): void {
    const idSet = new Set(ids);
    store.referrals = store.referrals.filter((r) => !idSet.has(r.id));
    this.persist('/api/referrals/batch-delete', 'POST', { ids });
  }

  // STUDENT CASES
  static getCases(): StudentCase[] {
    return store.cases;
  }

  static saveCase(caseItem: Partial<StudentCase> & { id?: string }): StudentCase {
    if (caseItem.id) {
      const idx = store.cases.findIndex((c) => c.id === caseItem.id);
      if (idx !== -1) {
        const updated = {
          ...store.cases[idx],
          ...caseItem,
          updatedAt: new Date().toISOString(),
        } as StudentCase;
        store.cases[idx] = updated;
        this.persist('/api/cases', 'POST', updated);
        return updated;
      }
    }
    const count = store.cases.length + 1;
    const newCase: StudentCase = {
      id: makeId('case'),
      caseNumber: `KASUS-2025-${String(count).padStart(3, '0')}`,
      title: caseItem.title || 'Kasus Bimbingan Siswa',
      studentId: caseItem.studentId || '',
      studentName: caseItem.studentName || '',
      studentClass: caseItem.studentClass || '',
      category: caseItem.category || 'kedisiplinan',
      priority: caseItem.priority || 'sedang',
      status: caseItem.status || 'investigasi',
      assignedCounselorId: caseItem.assignedCounselorId || 'u-2',
      assignedCounselorName: caseItem.assignedCounselorName || 'Siti Rahmawati, S.Pd., Kons.',
      incidentDate: caseItem.incidentDate || new Date().toISOString().split('T')[0],
      chronologySummary: caseItem.chronologySummary || '',
      confidentialDetails: caseItem.confidentialDetails || '',
      interventions: caseItem.interventions || [],
      resolutionNotes: caseItem.resolutionNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.cases = [newCase, ...store.cases];
    this.persist('/api/cases', 'POST', newCase);
    return newCase;
  }

  static deleteCase(id: string): void {
    store.cases = store.cases.filter((c) => c.id !== id);
    this.persist(`/api/cases/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleCases(ids: string[]): void {
    const idSet = new Set(ids);
    store.cases = store.cases.filter((c) => !idSet.has(c.id));
    this.persist('/api/cases/batch-delete', 'POST', { ids });
  }

  // PROGRAMS
  static getPrograms(): BKProgram[] {
    return store.programs;
  }

  static saveProgram(program: Partial<BKProgram> & { id?: string }): BKProgram {
    if (program.id) {
      const idx = store.programs.findIndex((p) => p.id === program.id);
      if (idx !== -1) {
        const updated = { ...store.programs[idx], ...program } as BKProgram;
        store.programs[idx] = updated;
        this.persist('/api/programs', 'POST', updated);
        return updated;
      }
    }
    const newProg: BKProgram = {
      id: makeId('prog'),
      title: program.title || 'Program Baru',
      domain: program.domain || 'pribadi',
      targetGrade: program.targetGrade || 'Semua',
      semester: program.semester || 'Genap',
      academicYear: program.academicYear || '2024/2025',
      objectives: program.objectives || '',
      scheduledMonth: program.scheduledMonth || 'Maret 2025',
      status: program.status || 'planned',
      completionPercentage: program.completionPercentage || 0,
    };
    store.programs = [...store.programs, newProg];
    this.persist('/api/programs', 'POST', newProg);
    return newProg;
  }

  static deleteProgram(id: string): void {
    store.programs = store.programs.filter((p) => p.id !== id);
    this.persist(`/api/programs/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultiplePrograms(ids: string[]): void {
    const idSet = new Set(ids);
    store.programs = store.programs.filter((p) => !idSet.has(p.id));
    this.persist('/api/programs/batch-delete', 'POST', { ids });
  }

  // ASSESSMENTS
  static getAssessments(): Assessment[] {
    return store.assessments;
  }

  static getSubmissions(): AssessmentSubmission[] {
    return store.submissions;
  }

  static submitAssessment(
    assessmentId: string,
    studentId: string,
    studentName: string,
    studentClass: string,
    answers: Record<string, string>
  ): AssessmentSubmission {
    const asm = store.assessments.find((a) => a.id === assessmentId);

    // Calculate score / dominant type (no clinical diagnosis - purely guidance typology)
    let dominantType = 'Seimbang';
    const recs: string[] = [];

    if (asm?.code === 'GAYA-BELAJAR-VAK') {
      let v = 0, a = 0, k = 0;
      Object.values(answers).forEach((val) => {
        if (val === 'V') v++;
        if (val === 'A') a++;
        if (val === 'K') k++;
      });
      if (v >= a && v >= k) {
        dominantType = `Visual (${Math.round((v / (v + a + k || 1)) * 100)}%)`;
        recs.push('Direkomendasikan memanfaatkan catatan beranotasi visual, infografis, dan diagram alur belajar.');
      } else if (a >= v && a >= k) {
        dominantType = `Auditori (${Math.round((a / (v + a + k || 1)) * 100)}%)`;
        recs.push('Direkomendasikan belajar lewat diskusi kelompok, rekaman audio, dan penjelasan verbal.');
      } else {
        dominantType = `Kinestetik (${Math.round((k / (v + a + k || 1)) * 100)}%)`;
        recs.push('Direkomendasikan belajar langsung dengan praktik praktikum atau simulasi interaktif.');
      }
    } else {
      dominantType = 'Tingkat Kebutuhan Teridentifikasi';
      recs.push('Guru BK akan mengagendakan materi bimbingan klasikal pendukung.');
    }

    const newSub: AssessmentSubmission = {
      id: makeId('sub'),
      assessmentId,
      assessmentTitle: asm ? asm.title : 'Asesmen BK',
      studentId,
      studentName,
      studentClass,
      submittedAt: new Date().toISOString(),
      answers,
      resultSummary: {
        dominantType,
        needsAnalysis: ['Pengembangan strategi belajar mandiri'],
        counselorRecommendation: recs.join(' '),
      },
    };

    store.submissions = [newSub, ...store.submissions];
    if (asm) {
      asm.submissionCount += 1;
    }

    this.persist('/api/assessments/submit', 'POST', newSub);
    return newSub;
  }

  // MATERIALS
  static getMaterials(): BKMaterial[] {
    return store.materials;
  }

  static saveMaterial(mat: Partial<BKMaterial> & { id?: string }): BKMaterial {
    if (mat.id) {
      const idx = store.materials.findIndex((m) => m.id === mat.id);
      if (idx !== -1) {
        const updated = { ...store.materials[idx], ...mat } as BKMaterial;
        store.materials[idx] = updated;
        this.persist('/api/materials', 'POST', updated);
        return updated;
      }
    }
    const newMat: BKMaterial = {
      id: makeId('mat'),
      title: mat.title || 'Materi BK Baru',
      domain: mat.domain || 'pribadi',
      targetGrade: mat.targetGrade || 'Semua Tingkat',
      authorName: mat.authorName || 'Guru BK',
      summary: mat.summary || '',
      content: mat.content || '',
      hasTask: !!mat.hasTask,
      taskPrompt: mat.taskPrompt || '',
      createdAt: new Date().toISOString(),
      readCount: 0,
    };
    store.materials = [newMat, ...store.materials];
    this.persist('/api/materials', 'POST', newMat);
    return newMat;
  }

  static deleteMaterial(id: string): void {
    store.materials = store.materials.filter((m) => m.id !== id);
    this.persist(`/api/materials/${encodeURIComponent(id)}`, 'DELETE');
  }

  static deleteMultipleMaterials(ids: string[]): void {
    const idSet = new Set(ids);
    store.materials = store.materials.filter((m) => !idSet.has(m.id));
    this.persist('/api/materials/batch-delete', 'POST', { ids });
  }

  // IMPORT / EXPORT HELPERS
  static exportStudentsCSV(): string {
    const students = this.getStudents();
    const headers = [
      'NISN',
      'NIS',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Kelas',
      'Jurusan',
      'Tahun Ajaran',
      'Nama Orang Tua',
      'No HP Ortu',
      'No HP Siswa',
      'Status',
    ];
    const rows = students.map((s) => [
      `"${s.nisn}"`,
      `"${s.nis}"`,
      `"${s.name}"`,
      `"${s.gender}"`,
      `"${s.className}"`,
      `"${s.majorName}"`,
      `"${s.academicYear}"`,
      `"${s.parentName}"`,
      `"${s.parentPhone}"`,
      `"${s.studentPhone}"`,
      `"${s.status}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  static getStudentCSVTemplate(): string {
    const headers = [
      'NISN',
      'NIS',
      'Nama Lengkap',
      'Jenis Kelamin (L/P)',
      'Kelas',
      'Jurusan',
      'Tahun Ajaran',
      'Nama Orang Tua',
      'No HP Ortu',
      'No HP Siswa',
    ];
    const sample = [
      '0081234567',
      '2425001',
      'Budi Santoso',
      'L',
      'X RPL 1',
      'Rekayasa Perangkat Lunak',
      '2024/2025',
      'Joko Widodo',
      '0812-3456-7890',
      '0813-9988-7766',
    ];
    return [headers.join(','), sample.join(',')].join('\n');
  }

  static importStudentsFromCSV(csvText: string): { importedCount: number; errors: string[] } {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { importedCount: 0, errors: ['File CSV kosong atau tidak memiliki baris data.'] };
    }
    const importedStudents: Student[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 3) {
        errors.push(`Baris ${i + 1}: Format kolom tidak sesuai.`);
        continue;
      }
      const [nisn, nis, name, gender, className, majorName, academicYear, parentName, parentPhone, studentPhone] = cols;
      const newS: Student = {
        id: makeId(`s-${i}`),
        nisn: nisn || '00' + Math.floor(10000000 + Math.random() * 90000000),
        nis: nis || '24' + Math.floor(10000 + Math.random() * 90000),
        name: name || 'Siswa Import ' + i,
        gender: gender?.toUpperCase() === 'P' ? 'P' : 'L',
        classId: 'c-1',
        className: className || 'X RPL 1',
        majorId: 'm-1',
        majorName: majorName || 'Rekayasa Perangkat Lunak',
        academicYear: academicYear || '2024/2025',
        parentName: parentName || '-',
        parentPhone: parentPhone || '-',
        studentPhone: studentPhone || '-',
        address: 'Alamat Siswa',
        status: 'active',
        counselingCount: 0,
        openCasesCount: 0,
      };
      importedStudents.push(newS);
    }

    if (importedStudents.length > 0) {
      store.students = [...importedStudents, ...store.students];
      this.persist('/api/students/import', 'POST', { students: importedStudents });
    }

    return { importedCount: importedStudents.length, errors };
  }

  static resetToDefaults(): void {
    store = cloneDefaults();
  }
}
