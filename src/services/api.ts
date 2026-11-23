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

const defaultAcademicYear = () => {
  const active = store.academicYears.find((y) => y.isActive);
  if (active) return active.year;
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};

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

  private static async persistAsync<T = unknown>(
    url: string,
    method: 'POST' | 'DELETE',
    body?: unknown
  ): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': activeRole,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    const text = await res.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      parsed = null;
    }

    if (!res.ok) {
      const message =
        (parsed && typeof parsed.error === 'string' && parsed.error) ||
        `Permintaan server gagal (${method} ${url}: HTTP ${res.status})`;
      throw new Error(message);
    }

    return parsed as T;
  }

  // Audit logger (non-blocking helper that still awaits backend insert cleanly)
  static async logAudit(
    userId: string,
    userName: string,
    userRole: UserRole,
    action: string,
    module: AuditLog['module'],
    description: string
  ): Promise<void> {
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
    try {
      await this.persistAsync('/api/audit-logs', 'POST', newLog);
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }

  static getAuditLogs(): AuditLog[] {
    return store.auditLogs;
  }

  static async deleteMultipleAuditLogs(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/audit-logs/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.auditLogs = store.auditLogs.filter((l) => !idSet.has(l.id));
  }

  // AUTHENTICATION
  static async login(
    username: string,
    password: string
  ): Promise<{ ok: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await response.json();
      if (!response.ok || !json?.user) {
        return {
          ok: false,
          error: json?.error || 'Username atau kata sandi tidak sesuai.',
        };
      }
      return { ok: true, user: json.user as User };
    } catch {
      return {
        ok: false,
        error: 'Gagal menghubungi server autentikasi.',
      };
    }
  }

  // USERS
  static getUsers(): User[] {
    return store.users;
  }

  static async saveUser(user: Partial<User> & { id?: string }): Promise<User> {
    const { password, ...rest } = user;
    if (rest.id) {
      const idx = store.users.findIndex((u) => u.id === rest.id);
      if (idx !== -1) {
        const cleanUpdated = { ...store.users[idx], ...rest } as User;
        const saved = await this.persistAsync<User>('/api/users', 'POST', {
          ...cleanUpdated,
          ...(password ? { password } : {}),
        });
        store.users[idx] = saved || cleanUpdated;
        return store.users[idx];
      }
    }
    const newUser: User = {
      id: makeId('u'),
      username: rest.username || 'user' + Math.floor(Math.random() * 1000),
      name: rest.name || 'Pengguna Baru',
      email: rest.email || '',
      role: rest.role || 'student',
      active: rest.active ?? true,
      nipOrNisn: rest.nipOrNisn || '',
      phone: rest.phone || '',
      assignedClass: rest.assignedClass,
      gradeLevel: rest.gradeLevel,
      createdAt: new Date().toISOString(),
    };
    const saved = await this.persistAsync<User>('/api/users', 'POST', {
      ...newUser,
      ...(password ? { password } : {}),
    });
    const finalUser = saved || newUser;
    store.users = [...store.users, finalUser];
    return finalUser;
  }

  static async deleteUser(id: string): Promise<void> {
    await this.persistAsync(`/api/users/${encodeURIComponent(id)}`, 'DELETE');
    store.users = store.users.filter((u) => u.id !== id);
  }

  static async deleteMultipleUsers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/users/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.users = store.users.filter((u) => !idSet.has(u.id));
  }

  // STUDENTS
  static getStudents(): Student[] {
    return store.students;
  }

  static async saveStudent(student: Partial<Student> & { id?: string }): Promise<Student> {
    if (student.id) {
      const idx = store.students.findIndex((s) => s.id === student.id);
      if (idx !== -1) {
        const updated = { ...store.students[idx], ...student } as Student;
        const saved = await this.persistAsync<Student>('/api/students', 'POST', updated);
        store.students[idx] = saved || updated;
        return store.students[idx];
      }
    }
    const newStudent: Student = {
      id: makeId('s'),
      nisn: student.nisn || '00' + Math.floor(10000000 + Math.random() * 90000000),
      nis: student.nis || '24' + Math.floor(10000 + Math.random() * 90000),
      name: student.name || 'Siswa Baru',
      gender: student.gender || 'L',
      classId: student.classId || '',
      className: student.className?.trim() || '-',
      majorId: student.majorId || '',
      majorName: student.majorName?.trim() || '-',
      academicYear: student.academicYear || defaultAcademicYear(),
      parentName: student.parentName || '-',
      parentPhone: student.parentPhone || '-',
      studentPhone: student.studentPhone || '-',
      address: student.address || '-',
      status: student.status || 'active',
      counselingCount: student.counselingCount ?? 0,
      openCasesCount: student.openCasesCount ?? 0,
    };
    const saved = await this.persistAsync<Student>('/api/students', 'POST', newStudent);
    const finalStudent = saved || newStudent;
    store.students = [finalStudent, ...store.students];
    return finalStudent;
  }

  static async deleteStudent(id: string): Promise<void> {
    await this.persistAsync(`/api/students/${encodeURIComponent(id)}`, 'DELETE');
    store.students = store.students.filter((s) => s.id !== id);
  }

  static async deleteMultipleStudents(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/students/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.students = store.students.filter((s) => !idSet.has(s.id));
  }

  // TEACHERS
  static getTeachers(): Teacher[] {
    return store.teachers;
  }

  static async saveTeacher(teacher: Partial<Teacher> & { id?: string }): Promise<Teacher> {
    if (teacher.id) {
      const idx = store.teachers.findIndex((t) => t.id === teacher.id);
      if (idx !== -1) {
        const updated = { ...store.teachers[idx], ...teacher } as Teacher;
        const saved = await this.persistAsync<Teacher>('/api/teachers', 'POST', updated);
        store.teachers[idx] = saved || updated;
        return store.teachers[idx];
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
    const saved = await this.persistAsync<Teacher>('/api/teachers', 'POST', newTeacher);
    const finalTeacher = saved || newTeacher;
    store.teachers = [...store.teachers, finalTeacher];
    return finalTeacher;
  }

  static async deleteTeacher(id: string): Promise<void> {
    await this.persistAsync(`/api/teachers/${encodeURIComponent(id)}`, 'DELETE');
    store.teachers = store.teachers.filter((t) => t.id !== id);
  }

  static async deleteMultipleTeachers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/teachers/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.teachers = store.teachers.filter((t) => !idSet.has(t.id));
  }

  // CLASSES & MAJORS & ACADEMIC YEARS
  static getClasses(): SchoolClass[] {
    return store.classes;
  }

  static async saveClass(item: Partial<SchoolClass> & { id?: string }): Promise<SchoolClass> {
    if (item.id) {
      const idx = store.classes.findIndex((c) => c.id === item.id);
      if (idx !== -1) {
        const updated = { ...store.classes[idx], ...item } as SchoolClass;
        const saved = await this.persistAsync<SchoolClass>('/api/classes', 'POST', updated);
        store.classes[idx] = saved || updated;
        return store.classes[idx];
      }
    }
    const newClass: SchoolClass = {
      id: makeId('c'),
      name: item.name || 'Kelas Baru',
      grade: item.grade || '10',
      majorId: item.majorId || '',
      majorName: item.majorName?.trim() || '-',
      studentCount: item.studentCount || 0,
      academicYear: item.academicYear || defaultAcademicYear(),
      homeroomTeacherId: item.homeroomTeacherId,
      homeroomTeacherName: item.homeroomTeacherName,
    };
    const saved = await this.persistAsync<SchoolClass>('/api/classes', 'POST', newClass);
    const finalClass = saved || newClass;
    store.classes = [...store.classes, finalClass];
    return finalClass;
  }

  static async deleteClass(id: string): Promise<void> {
    await this.persistAsync(`/api/classes/${encodeURIComponent(id)}`, 'DELETE');
    store.classes = store.classes.filter((c) => c.id !== id);
  }

  static async deleteMultipleClasses(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/classes/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.classes = store.classes.filter((c) => !idSet.has(c.id));
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

  static async saveCounselingSession(
    session: Partial<CounselingSession> & { id?: string }
  ): Promise<CounselingSession> {
    if (session.id) {
      const idx = store.counselingSessions.findIndex((s) => s.id === session.id);
      if (idx !== -1) {
        const updated = { ...store.counselingSessions[idx], ...session } as CounselingSession;
        const saved = await this.persistAsync<CounselingSession>(
          '/api/counseling-sessions',
          'POST',
          updated
        );
        store.counselingSessions[idx] = saved || updated;
        return store.counselingSessions[idx];
      }
    }
    const count = store.counselingSessions.length + 1;
    const newSession: CounselingSession = {
      id: makeId('cs'),
      ticketNumber: `BK-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      studentId: session.studentId || '',
      studentName: session.studentName || 'Siswa',
      studentClass: session.studentClass || '-',
      counselorId: session.counselorId || '',
      counselorName: session.counselorName || 'Guru BK',
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
    const saved = await this.persistAsync<CounselingSession>(
      '/api/counseling-sessions',
      'POST',
      newSession
    );
    const finalSession = saved || newSession;
    store.counselingSessions = [finalSession, ...store.counselingSessions];
    return finalSession;
  }

  static async deleteCounselingSession(id: string): Promise<void> {
    await this.persistAsync(`/api/counseling-sessions/${encodeURIComponent(id)}`, 'DELETE');
    store.counselingSessions = store.counselingSessions.filter((s) => s.id !== id);
  }

  static async deleteMultipleCounselingSessions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/counseling-sessions/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.counselingSessions = store.counselingSessions.filter((s) => !idSet.has(s.id));
  }

  // REFERRALS
  static getReferrals(): Referral[] {
    return store.referrals;
  }

  static async saveReferral(ref: Partial<Referral> & { id?: string }): Promise<Referral> {
    if (ref.id) {
      const idx = store.referrals.findIndex((r) => r.id === ref.id);
      if (idx !== -1) {
        const updated = {
          ...store.referrals[idx],
          ...ref,
          updatedAt: new Date().toISOString(),
        } as Referral;
        const saved = await this.persistAsync<Referral>('/api/referrals', 'POST', updated);
        store.referrals[idx] = saved || updated;
        return store.referrals[idx];
      }
    }
    const count = store.referrals.length + 1;
    const newRef: Referral = {
      id: makeId('ref'),
      referralNumber: `RUJ-${new Date().getFullYear()}-${String(count).padStart(2, '0')}`,
      studentId: ref.studentId || '',
      studentName: ref.studentName || '',
      studentClass: ref.studentClass || '',
      referredByTeacherId: ref.referredByTeacherId || '',
      referredByTeacherName: ref.referredByTeacherName || 'Wali Kelas',
      counselorId: ref.counselorId,
      counselorName: ref.counselorName,
      reason: ref.reason || '',
      indicators: ref.indicators || [],
      urgency: ref.urgency || 'medium',
      status: ref.status || 'pending',
      counselorFeedback: ref.counselorFeedback || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await this.persistAsync<Referral>('/api/referrals', 'POST', newRef);
    const finalRef = saved || newRef;
    store.referrals = [finalRef, ...store.referrals];
    return finalRef;
  }

  static async deleteReferral(id: string): Promise<void> {
    await this.persistAsync(`/api/referrals/${encodeURIComponent(id)}`, 'DELETE');
    store.referrals = store.referrals.filter((r) => r.id !== id);
  }

  static async deleteMultipleReferrals(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/referrals/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.referrals = store.referrals.filter((r) => !idSet.has(r.id));
  }

  // STUDENT CASES
  static getCases(): StudentCase[] {
    return store.cases;
  }

  static async saveCase(caseItem: Partial<StudentCase> & { id?: string }): Promise<StudentCase> {
    if (caseItem.id) {
      const idx = store.cases.findIndex((c) => c.id === caseItem.id);
      if (idx !== -1) {
        const updated = {
          ...store.cases[idx],
          ...caseItem,
          updatedAt: new Date().toISOString(),
        } as StudentCase;
        const saved = await this.persistAsync<StudentCase>('/api/cases', 'POST', updated);
        store.cases[idx] = saved || updated;
        return store.cases[idx];
      }
    }
    const count = store.cases.length + 1;
    const newCase: StudentCase = {
      id: makeId('case'),
      caseNumber: `KASUS-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      title: caseItem.title || 'Kasus Bimbingan Siswa',
      studentId: caseItem.studentId || '',
      studentName: caseItem.studentName || '',
      studentClass: caseItem.studentClass || '',
      category: caseItem.category || 'kedisiplinan',
      priority: caseItem.priority || 'sedang',
      status: caseItem.status || 'investigasi',
      assignedCounselorId: caseItem.assignedCounselorId || '',
      assignedCounselorName: caseItem.assignedCounselorName || 'Guru BK',
      incidentDate: caseItem.incidentDate || new Date().toISOString().split('T')[0],
      chronologySummary: caseItem.chronologySummary || '',
      confidentialDetails: caseItem.confidentialDetails || '',
      interventions: caseItem.interventions || [],
      resolutionNotes: caseItem.resolutionNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = await this.persistAsync<StudentCase>('/api/cases', 'POST', newCase);
    const finalCase = saved || newCase;
    store.cases = [finalCase, ...store.cases];
    return finalCase;
  }

  static async deleteCase(id: string): Promise<void> {
    await this.persistAsync(`/api/cases/${encodeURIComponent(id)}`, 'DELETE');
    store.cases = store.cases.filter((c) => c.id !== id);
  }

  static async deleteMultipleCases(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/cases/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.cases = store.cases.filter((c) => !idSet.has(c.id));
  }

  // PROGRAMS
  static getPrograms(): BKProgram[] {
    return store.programs;
  }

  static async saveProgram(program: Partial<BKProgram> & { id?: string }): Promise<BKProgram> {
    if (program.id) {
      const idx = store.programs.findIndex((p) => p.id === program.id);
      if (idx !== -1) {
        const updated = { ...store.programs[idx], ...program } as BKProgram;
        const saved = await this.persistAsync<BKProgram>('/api/programs', 'POST', updated);
        store.programs[idx] = saved || updated;
        return store.programs[idx];
      }
    }
    const newProg: BKProgram = {
      id: makeId('prog'),
      title: program.title || 'Program Baru',
      domain: program.domain || 'pribadi',
      targetGrade: program.targetGrade || 'Semua',
      semester: program.semester || 'Genap',
      academicYear: program.academicYear || defaultAcademicYear(),
      objectives: program.objectives || '',
      scheduledMonth: program.scheduledMonth || 'Maret',
      status: program.status || 'planned',
      completionPercentage: program.completionPercentage || 0,
    };
    const saved = await this.persistAsync<BKProgram>('/api/programs', 'POST', newProg);
    const finalProg = saved || newProg;
    store.programs = [...store.programs, finalProg];
    return finalProg;
  }

  static async deleteProgram(id: string): Promise<void> {
    await this.persistAsync(`/api/programs/${encodeURIComponent(id)}`, 'DELETE');
    store.programs = store.programs.filter((p) => p.id !== id);
  }

  static async deleteMultiplePrograms(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/programs/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.programs = store.programs.filter((p) => !idSet.has(p.id));
  }

  // ASSESSMENTS
  static getAssessments(): Assessment[] {
    return store.assessments;
  }

  static getSubmissions(): AssessmentSubmission[] {
    return store.submissions;
  }

  static async submitAssessment(
    assessmentId: string,
    studentId: string,
    studentName: string,
    studentClass: string,
    answers: Record<string, string>
  ): Promise<AssessmentSubmission> {
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

    const saved = await this.persistAsync<AssessmentSubmission>(
      '/api/assessments/submit',
      'POST',
      newSub
    );
    const finalSub = saved || newSub;
    store.submissions = [finalSub, ...store.submissions];
    if (asm) {
      asm.submissionCount += 1;
    }

    return finalSub;
  }

  // MATERIALS
  static getMaterials(): BKMaterial[] {
    return store.materials;
  }

  static async saveMaterial(mat: Partial<BKMaterial> & { id?: string }): Promise<BKMaterial> {
    if (mat.id) {
      const idx = store.materials.findIndex((m) => m.id === mat.id);
      if (idx !== -1) {
        const updated = { ...store.materials[idx], ...mat } as BKMaterial;
        const saved = await this.persistAsync<BKMaterial>('/api/materials', 'POST', updated);
        store.materials[idx] = saved || updated;
        return store.materials[idx];
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
    const saved = await this.persistAsync<BKMaterial>('/api/materials', 'POST', newMat);
    const finalMat = saved || newMat;
    store.materials = [finalMat, ...store.materials];
    return finalMat;
  }

  static async deleteMaterial(id: string): Promise<void> {
    await this.persistAsync(`/api/materials/${encodeURIComponent(id)}`, 'DELETE');
    store.materials = store.materials.filter((m) => m.id !== id);
  }

  static async deleteMultipleMaterials(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.persistAsync('/api/materials/batch-delete', 'POST', { ids });
    const idSet = new Set(ids);
    store.materials = store.materials.filter((m) => !idSet.has(m.id));
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
      'Nama Siswa',
      'L',
      'X RPL 1',
      'Rekayasa Perangkat Lunak',
      defaultAcademicYear(),
      'Nama Wali',
      '0812-3456-7890',
      '0813-9988-7766',
    ];
    return [headers.join(','), sample.join(',')].join('\n');
  }

  static async importStudentsFromCSV(
    csvText: string
  ): Promise<{ importedCount: number; errors: string[] }> {
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
        classId: '',
        className: className || '-',
        majorId: '',
        majorName: majorName || '-',
        academicYear: academicYear || defaultAcademicYear(),
        parentName: parentName || '-',
        parentPhone: parentPhone || '-',
        studentPhone: studentPhone || '-',
        address: '-',
        status: 'active',
        counselingCount: 0,
        openCasesCount: 0,
      };
      importedStudents.push(newS);
    }

    if (importedStudents.length > 0) {
      await this.persistAsync('/api/students/import', 'POST', { students: importedStudents });
      store.students = [...importedStudents, ...store.students];
    }

    return { importedCount: importedStudents.length, errors };
  }

  static async createFullBackup(): Promise<{
    meta: { app: string; version: string; exportedAt: string };
    data: ClientStore;
  }> {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'GET',
        headers: { 'x-user-role': activeRole },
        cache: 'no-store',
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Server backup failed, falling back to current session store:', error);
    }
    return {
      meta: {
        app: 'BKSmart',
        version: '1.0',
        exportedAt: new Date().toISOString(),
      },
      data: structuredClone(store),
    };
  }

  static async restoreFullBackup(
    payload: unknown
  ): Promise<{ ok: boolean; counts: Record<string, number>; error?: string }> {
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': activeRole,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          counts: {},
          error: json?.error || `HTTP ${res.status}`,
        };
      }
      await this.syncFromServer(activeRole);
      return { ok: true, counts: json.counts || {} };
    } catch (error) {
      return {
        ok: false,
        counts: {},
        error: error instanceof Error ? error.message : 'Gagal menghubungi server restore',
      };
    }
  }

  static resetToDefaults(): void {
    store = cloneDefaults();
  }
}
