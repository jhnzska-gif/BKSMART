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

// Local storage key prefix
const STORAGE_PREFIX = 'bksmart_';

function getStorage<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error', e);
  }
}

export class APIService {
  // Audit logger
  static logAudit(userId: string, userName: string, userRole: UserRole, action: string, module: AuditLog['module'], description: string) {
    const logs = getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    const newLog: AuditLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole,
      action,
      module,
      description,
      ipAddress: '127.0.0.1 (Web Portal)',
    };
    logs.unshift(newLog);
    setStorage('audit_logs', logs.slice(0, 100)); // retain last 100 logs
  }

  static getAuditLogs(): AuditLog[] {
    return getStorage<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
  }

  // USERS
  static getUsers(): User[] {
    return getStorage<User[]>('users', INITIAL_USERS);
  }

  static saveUser(user: Partial<User> & { id?: string }): User {
    const users = this.getUsers();
    if (user.id) {
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user } as User;
        setStorage('users', users);
        return users[idx];
      }
    }
    const newUser: User = {
      id: 'u-' + Date.now(),
      username: user.username || 'user' + Math.floor(Math.random() * 1000),
      name: user.name || 'Pengguna Baru',
      email: user.email || '',
      role: user.role || 'student',
      active: true,
      nipOrNisn: user.nipOrNisn || '',
      phone: user.phone || '',
      assignedClass: user.assignedClass,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setStorage('users', users);
    return newUser;
  }

  static deleteUser(id: string): void {
    const users = this.getUsers().filter(u => u.id !== id);
    setStorage('users', users);
  }

  static deleteMultipleUsers(ids: string[]): void {
    const idSet = new Set(ids);
    const users = this.getUsers().filter(u => !idSet.has(u.id));
    setStorage('users', users);
  }

  // STUDENTS
  static getStudents(): Student[] {
    const list = getStorage<Student[]>('students', INITIAL_STUDENTS);
    if (!list || list.length === 0) {
      setStorage('students', INITIAL_STUDENTS);
      return INITIAL_STUDENTS;
    }
    const existingIds = new Set(list.map(s => s.id));
    const missing = INITIAL_STUDENTS.filter(s => !existingIds.has(s.id));
    if (missing.length > 0) {
      const merged = [...list, ...missing];
      setStorage('students', merged);
      return merged;
    }
    return list;
  }

  static saveStudent(student: Partial<Student> & { id?: string }): Student {
    const students = this.getStudents();
    if (student.id) {
      const idx = students.findIndex(s => s.id === student.id);
      if (idx !== -1) {
        students[idx] = { ...students[idx], ...student } as Student;
        setStorage('students', students);
        return students[idx];
      }
    }
    const newStudent: Student = {
      id: 's-' + Date.now(),
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
      counselingCount: 0,
      openCasesCount: 0,
    };
    students.unshift(newStudent);
    setStorage('students', students);
    return newStudent;
  }

  static deleteStudent(id: string): void {
    const students = this.getStudents().filter(s => s.id !== id);
    setStorage('students', students);
  }

  static deleteMultipleStudents(ids: string[]): void {
    const idSet = new Set(ids);
    const students = this.getStudents().filter(s => !idSet.has(s.id));
    setStorage('students', students);
  }

  // TEACHERS
  static getTeachers(): Teacher[] {
    return getStorage<Teacher[]>('teachers', INITIAL_TEACHERS);
  }

  static saveTeacher(teacher: Partial<Teacher> & { id?: string }): Teacher {
    const teachers = this.getTeachers();
    if (teacher.id) {
      const idx = teachers.findIndex(t => t.id === teacher.id);
      if (idx !== -1) {
        teachers[idx] = { ...teachers[idx], ...teacher } as Teacher;
        setStorage('teachers', teachers);
        return teachers[idx];
      }
    }
    const newTeacher: Teacher = {
      id: 't-' + Date.now(),
      nip: teacher.nip || '199' + Math.floor(100000000000 + Math.random() * 900000000000),
      name: teacher.name || 'Guru Baru',
      gender: teacher.gender || 'L',
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: teacher.role || 'teacher',
      specialization: teacher.specialization,
      assignedClass: teacher.assignedClass,
    };
    teachers.push(newTeacher);
    setStorage('teachers', teachers);
    return newTeacher;
  }

  static deleteTeacher(id: string): void {
    const teachers = this.getTeachers().filter(t => t.id !== id);
    setStorage('teachers', teachers);
  }

  static deleteMultipleTeachers(ids: string[]): void {
    const idSet = new Set(ids);
    const teachers = this.getTeachers().filter(t => !idSet.has(t.id));
    setStorage('teachers', teachers);
  }

  // CLASSES & MAJORS & ACADEMIC YEARS
  static getClasses(): SchoolClass[] {
    return getStorage<SchoolClass[]>('classes', INITIAL_CLASSES);
  }

  static saveClass(item: Partial<SchoolClass> & { id?: string }): SchoolClass {
    const classes = this.getClasses();
    if (item.id) {
      const idx = classes.findIndex(c => c.id === item.id);
      if (idx !== -1) {
        classes[idx] = { ...classes[idx], ...item } as SchoolClass;
        setStorage('classes', classes);
        return classes[idx];
      }
    }
    const newClass: SchoolClass = {
      id: 'c-' + Date.now(),
      name: item.name || 'Kelas Baru',
      grade: item.grade || '10',
      majorId: item.majorId || 'm-1',
      majorName: item.majorName || 'Rekayasa Perangkat Lunak',
      studentCount: item.studentCount || 0,
      academicYear: item.academicYear || '2024/2025',
      homeroomTeacherId: item.homeroomTeacherId,
      homeroomTeacherName: item.homeroomTeacherName,
    };
    classes.push(newClass);
    setStorage('classes', classes);
    return newClass;
  }

  static deleteClass(id: string): void {
    setStorage('classes', this.getClasses().filter(c => c.id !== id));
  }

  static deleteMultipleClasses(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('classes', this.getClasses().filter(c => !idSet.has(c.id)));
  }

  static getMajors(): Major[] {
    return getStorage<Major[]>('majors', INITIAL_MAJORS);
  }

  static getAcademicYears(): AcademicYear[] {
    return getStorage<AcademicYear[]>('academic_years', INITIAL_ACADEMIC_YEARS);
  }

  // COUNSELING SESSIONS
  static getCounselingSessions(): CounselingSession[] {
    return getStorage<CounselingSession[]>('counseling_sessions', INITIAL_COUNSELING_SESSIONS);
  }

  static saveCounselingSession(session: Partial<CounselingSession> & { id?: string }): CounselingSession {
    const sessions = this.getCounselingSessions();
    if (session.id) {
      const idx = sessions.findIndex(s => s.id === session.id);
      if (idx !== -1) {
        sessions[idx] = { ...sessions[idx], ...session } as CounselingSession;
        setStorage('counseling_sessions', sessions);
        return sessions[idx];
      }
    }
    const count = sessions.length + 1;
    const newSession: CounselingSession = {
      id: 'cs-' + Date.now(),
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
    sessions.unshift(newSession);
    setStorage('counseling_sessions', sessions);
    return newSession;
  }

  static deleteCounselingSession(id: string): void {
    setStorage('counseling_sessions', this.getCounselingSessions().filter(s => s.id !== id));
  }

  static deleteMultipleCounselingSessions(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('counseling_sessions', this.getCounselingSessions().filter(s => !idSet.has(s.id)));
  }

  // REFERRALS
  static getReferrals(): Referral[] {
    return getStorage<Referral[]>('referrals', INITIAL_REFERRALS);
  }

  static saveReferral(ref: Partial<Referral> & { id?: string }): Referral {
    const refs = this.getReferrals();
    if (ref.id) {
      const idx = refs.findIndex(r => r.id === ref.id);
      if (idx !== -1) {
        refs[idx] = { ...refs[idx], ...ref, updatedAt: new Date().toISOString() } as Referral;
        setStorage('referrals', refs);
        return refs[idx];
      }
    }
    const count = refs.length + 1;
    const newRef: Referral = {
      id: 'ref-' + Date.now(),
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
      status: 'pending',
      counselorFeedback: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    refs.unshift(newRef);
    setStorage('referrals', refs);
    return newRef;
  }

  static deleteReferral(id: string): void {
    setStorage('referrals', this.getReferrals().filter(r => r.id !== id));
  }

  static deleteMultipleReferrals(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('referrals', this.getReferrals().filter(r => !idSet.has(r.id)));
  }

  // STUDENT CASES
  static getCases(): StudentCase[] {
    return getStorage<StudentCase[]>('cases', INITIAL_CASES);
  }

  static saveCase(caseItem: Partial<StudentCase> & { id?: string }): StudentCase {
    const cases = this.getCases();
    if (caseItem.id) {
      const idx = cases.findIndex(c => c.id === caseItem.id);
      if (idx !== -1) {
        cases[idx] = { ...cases[idx], ...caseItem, updatedAt: new Date().toISOString() } as StudentCase;
        setStorage('cases', cases);
        return cases[idx];
      }
    }
    const count = cases.length + 1;
    const newCase: StudentCase = {
      id: 'case-' + Date.now(),
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cases.unshift(newCase);
    setStorage('cases', cases);
    return newCase;
  }

  static deleteCase(id: string): void {
    setStorage('cases', this.getCases().filter(c => c.id !== id));
  }

  static deleteMultipleCases(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('cases', this.getCases().filter(c => !idSet.has(c.id)));
  }

  // PROGRAMS
  static getPrograms(): BKProgram[] {
    return getStorage<BKProgram[]>('programs', INITIAL_PROGRAMS);
  }

  static saveProgram(program: Partial<BKProgram> & { id?: string }): BKProgram {
    const list = this.getPrograms();
    if (program.id) {
      const idx = list.findIndex(p => p.id === program.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...program } as BKProgram;
        setStorage('programs', list);
        return list[idx];
      }
    }
    const newProg: BKProgram = {
      id: 'prog-' + Date.now(),
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
    list.push(newProg);
    setStorage('programs', list);
    return newProg;
  }

  static deleteProgram(id: string): void {
    setStorage('programs', this.getPrograms().filter(p => p.id !== id));
  }

  static deleteMultiplePrograms(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('programs', this.getPrograms().filter(p => !idSet.has(p.id)));
  }

  // ASSESSMENTS
  static getAssessments(): Assessment[] {
    return getStorage<Assessment[]>('assessments', INITIAL_ASSESSMENTS);
  }

  static getSubmissions(): AssessmentSubmission[] {
    return getStorage<AssessmentSubmission[]>('submissions', INITIAL_SUBMISSIONS);
  }

  static submitAssessment(
    assessmentId: string,
    studentId: string,
    studentName: string,
    studentClass: string,
    answers: Record<string, string>
  ): AssessmentSubmission {
    const assessments = this.getAssessments();
    const asm = assessments.find(a => a.id === assessmentId);
    const submissions = this.getSubmissions();

    // Calculate score / dominant type (no clinical diagnosis - purely guidance typology)
    let dominantType = 'Seimbang';
    const recs: string[] = [];

    if (asm?.code === 'GAYA-BELAJAR-VAK') {
      let v = 0, a = 0, k = 0;
      Object.values(answers).forEach(val => {
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
      id: 'sub-' + Date.now(),
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
      }
    };

    submissions.unshift(newSub);
    setStorage('submissions', submissions);

    // update count
    if (asm) {
      asm.submissionCount += 1;
      setStorage('assessments', assessments);
    }

    return newSub;
  }

  // MATERIALS
  static getMaterials(): BKMaterial[] {
    return getStorage<BKMaterial[]>('materials', INITIAL_MATERIALS);
  }

  static saveMaterial(mat: Partial<BKMaterial> & { id?: string }): BKMaterial {
    const list = this.getMaterials();
    if (mat.id) {
      const idx = list.findIndex(m => m.id === mat.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...mat } as BKMaterial;
        setStorage('materials', list);
        return list[idx];
      }
    }
    const newMat: BKMaterial = {
      id: 'mat-' + Date.now(),
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
    list.unshift(newMat);
    setStorage('materials', list);
    return newMat;
  }

  static deleteMaterial(id: string): void {
    setStorage('materials', this.getMaterials().filter(m => m.id !== id));
  }

  static deleteMultipleMaterials(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('materials', this.getMaterials().filter(m => !idSet.has(m.id)));
  }

  static deleteMultipleAuditLogs(ids: string[]): void {
    const idSet = new Set(ids);
    setStorage('audit_logs', this.getAuditLogs().filter(l => !idSet.has(l.id)));
  }

  // IMPORT / EXPORT HELPERS
  static exportStudentsCSV(): string {
    const students = this.getStudents();
    const headers = ['NISN', 'NIS', 'Nama Lengkap', 'Jenis Kelamin', 'Kelas', 'Jurusan', 'Tahun Ajaran', 'Nama Orang Tua', 'No HP Ortu', 'No HP Siswa', 'Status'];
    const rows = students.map(s => [
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
      `"${s.status}"`
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  static getStudentCSVTemplate(): string {
    const headers = ['NISN', 'NIS', 'Nama Lengkap', 'Jenis Kelamin (L/P)', 'Kelas', 'Jurusan', 'Tahun Ajaran', 'Nama Orang Tua', 'No HP Ortu', 'No HP Siswa'];
    const sample = ['0081234567', '2425001', 'Budi Santoso', 'L', 'X RPL 1', 'Rekayasa Perangkat Lunak', '2024/2025', 'Joko Widodo', '0812-3456-7890', '0813-9988-7766'];
    return [headers.join(','), sample.join(',')].join('\n');
  }

  static importStudentsFromCSV(csvText: string): { importedCount: number; errors: string[] } {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { importedCount: 0, errors: ['File CSV kosong atau tidak memiliki baris data.'] };
    }
    const currentStudents = this.getStudents();
    let count = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // parse CSV line with quotes support
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      if (cols.length < 3) {
        errors.push(`Baris ${i + 1}: Format kolom tidak sesuai.`);
        continue;
      }
      const [nisn, nis, name, gender, className, majorName, academicYear, parentName, parentPhone, studentPhone] = cols;
      const newS: Student = {
        id: 's-' + Date.now() + '-' + i,
        nisn: nisn || '00' + Math.floor(10000000 + Math.random() * 90000000),
        nis: nis || '24' + Math.floor(10000 + Math.random() * 90000),
        name: name || 'Siswa Import ' + i,
        gender: (gender?.toUpperCase() === 'P' ? 'P' : 'L'),
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
      currentStudents.unshift(newS);
      count++;
    }

    setStorage('students', currentStudents);
    return { importedCount: count, errors };
  }

  // Reset to initial demo data
  static resetToDefaults(): void {
    localStorage.removeItem(STORAGE_PREFIX + 'users');
    localStorage.removeItem(STORAGE_PREFIX + 'students');
    localStorage.removeItem(STORAGE_PREFIX + 'teachers');
    localStorage.removeItem(STORAGE_PREFIX + 'classes');
    localStorage.removeItem(STORAGE_PREFIX + 'counseling_sessions');
    localStorage.removeItem(STORAGE_PREFIX + 'referrals');
    localStorage.removeItem(STORAGE_PREFIX + 'cases');
    localStorage.removeItem(STORAGE_PREFIX + 'programs');
    localStorage.removeItem(STORAGE_PREFIX + 'assessments');
    localStorage.removeItem(STORAGE_PREFIX + 'submissions');
    localStorage.removeItem(STORAGE_PREFIX + 'materials');
    localStorage.removeItem(STORAGE_PREFIX + 'audit_logs');
  }
}
