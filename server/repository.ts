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
  UserRole,
} from '../src/types/index.ts';
import { ensureNeonReady, memoryStore } from './db.ts';

function sanitizeRole(roleHeader: unknown): UserRole {
  const valid: UserRole[] = ['admin', 'counselor', 'teacher', 'student', 'principal'];
  const r = typeof roleHeader === 'string' ? roleHeader.toLowerCase() : '';
  return valid.includes(r as UserRole) ? (r as UserRole) : 'student';
}

export class BKSmartRepository {
  static async getBootstrap(callerRoleHeader?: unknown) {
    const callerRole = sanitizeRole(callerRoleHeader);
    const canSeeConfidential = callerRole === 'counselor';

    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        return {
          users: memoryStore.users,
          students: memoryStore.students,
          teachers: memoryStore.teachers,
          classes: memoryStore.classes,
          majors: memoryStore.majors,
          academicYears: memoryStore.academicYears,
          counselingSessions: memoryStore.counselingSessions.map((s) =>
            canSeeConfidential ? s : { ...s, confidentialNotes: undefined }
          ),
          referrals: memoryStore.referrals,
          cases: memoryStore.cases.map((c) =>
            canSeeConfidential ? c : { ...c, confidentialDetails: undefined }
          ),
          programs: memoryStore.programs,
          assessments: memoryStore.assessments,
          submissions: memoryStore.submissions,
          materials: memoryStore.materials,
          auditLogs: memoryStore.auditLogs,
        };
      }

      const [
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
        auditRes,
      ] = await Promise.all([
        pool.query('SELECT * FROM users ORDER BY created_at ASC'),
        pool.query('SELECT * FROM students ORDER BY id ASC'),
        pool.query('SELECT * FROM teachers ORDER BY id ASC'),
        pool.query('SELECT * FROM school_classes ORDER BY name ASC'),
        pool.query('SELECT * FROM majors ORDER BY code ASC'),
        pool.query('SELECT * FROM academic_years ORDER BY year DESC, semester DESC'),
        pool.query('SELECT * FROM counseling_sessions ORDER BY created_at DESC'),
        pool.query('SELECT * FROM referrals ORDER BY created_at DESC'),
        pool.query('SELECT * FROM student_cases ORDER BY created_at DESC'),
        pool.query('SELECT * FROM bk_programs ORDER BY id ASC'),
        pool.query('SELECT * FROM assessments ORDER BY id ASC'),
        pool.query('SELECT * FROM assessment_submissions ORDER BY submitted_at DESC'),
        pool.query('SELECT * FROM bk_materials ORDER BY created_at DESC'),
        pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100'),
      ]);

      return {
        users: usersRes.rows.map((r): User => ({
          id: r.id,
          username: r.username,
          name: r.name,
          email: r.email,
          role: r.role,
          avatar: r.avatar ?? undefined,
          nipOrNisn: r.nip_or_nisn ?? '',
          phone: r.phone ?? '',
          assignedClass: r.assigned_class ?? undefined,
          gradeLevel: r.grade_level ?? undefined,
          active: Boolean(r.active),
          createdAt: r.created_at,
        })),
        students: studentsRes.rows.map((r): Student => ({
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
          openCasesCount: Number(r.open_cases_count || 0),
        })),
        teachers: teachersRes.rows.map((r): Teacher => ({
          id: r.id,
          nip: r.nip,
          name: r.name,
          gender: r.gender,
          email: r.email,
          phone: r.phone,
          role: r.role,
          specialization: r.specialization ?? undefined,
          assignedClass: r.assigned_class ?? undefined,
        })),
        classes: classesRes.rows.map((r): SchoolClass => ({
          id: r.id,
          name: r.name,
          grade: r.grade,
          majorId: r.major_id,
          majorName: r.major_name,
          homeroomTeacherId: r.homeroom_teacher_id ?? undefined,
          homeroomTeacherName: r.homeroom_teacher_name ?? undefined,
          studentCount: Number(r.student_count || 0),
          academicYear: r.academic_year,
        })),
        majors: majorsRes.rows.map((r): Major => ({
          id: r.id,
          code: r.code,
          name: r.name,
          headOfMajor: r.head_of_major ?? undefined,
        })),
        academicYears: yearsRes.rows.map((r): AcademicYear => ({
          id: r.id,
          year: r.year,
          semester: r.semester,
          isActive: Boolean(r.is_active),
        })),
        counselingSessions: sessionsRes.rows.map((r): CounselingSession => ({
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
          confidentialNotes: canSeeConfidential ? (r.confidential_notes ?? '') : undefined,
          actionPlan: r.action_plan ?? '',
          outcomeSummary: r.outcome_summary ?? '',
          followUpDate: r.follow_up_date ?? undefined,
          createdAt: r.created_at,
        })),
        referrals: referralsRes.rows.map((r): Referral => ({
          id: r.id,
          referralNumber: r.referral_number,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          referredByTeacherId: r.referred_by_teacher_id,
          referredByTeacherName: r.referred_by_teacher_name,
          counselorId: r.counselor_id ?? undefined,
          counselorName: r.counselor_name ?? undefined,
          reason: r.reason,
          indicators: Array.isArray(r.indicators) ? r.indicators : [],
          urgency: r.urgency,
          status: r.status,
          counselorFeedback: r.counselor_feedback ?? '',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        cases: casesRes.rows.map((r): StudentCase => ({
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
          confidentialDetails: canSeeConfidential ? (r.confidential_details ?? '') : undefined,
          interventions: Array.isArray(r.interventions) ? r.interventions : [],
          resolutionNotes: r.resolution_notes ?? '',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        programs: programsRes.rows.map((r): BKProgram => ({
          id: r.id,
          title: r.title,
          domain: r.domain,
          targetGrade: r.target_grade,
          semester: r.semester,
          academicYear: r.academic_year,
          objectives: r.objectives,
          scheduledMonth: r.scheduled_month,
          status: r.status,
          completionPercentage: Number(r.completion_percentage || 0),
        })),
        assessments: assessmentsRes.rows.map((r): Assessment => ({
          id: r.id,
          title: r.title,
          code: r.code,
          description: r.description,
          targetClass: r.target_class,
          questions: Array.isArray(r.questions) ? r.questions : [],
          deadline: r.deadline,
          status: r.status,
          submissionCount: Number(r.submission_count || 0),
          totalTarget: Number(r.total_target || 0),
        })),
        submissions: submissionsRes.rows.map((r): AssessmentSubmission => ({
          id: r.id,
          assessmentId: r.assessment_id,
          assessmentTitle: r.assessment_title,
          studentId: r.student_id,
          studentName: r.student_name,
          studentClass: r.student_class,
          submittedAt: r.submitted_at,
          answers: r.answers || {},
          resultSummary: r.result_summary || {},
        })),
        materials: materialsRes.rows.map((r): BKMaterial => ({
          id: r.id,
          title: r.title,
          domain: r.domain,
          targetGrade: r.target_grade,
          authorName: r.author_name,
          summary: r.summary,
          content: r.content,
          hasTask: Boolean(r.has_task),
          taskPrompt: r.task_prompt ?? '',
          createdAt: r.created_at,
          readCount: Number(r.read_count || 0),
        })),
        auditLogs: auditRes.rows.map((r): AuditLog => ({
          id: r.id,
          timestamp: r.timestamp,
          userId: r.user_id,
          userName: r.user_name,
          userRole: r.user_role,
          action: r.action,
          module: r.module,
          description: r.description,
          ipAddress: r.ip_address,
        })),
      };
    } catch (error) {
      console.error('Database bootstrap query failed:', error);
      throw new Error('Gagal memuat data dari database.', { cause: error });
    }
  }

  // USERS
  static async saveUser(user: User): Promise<User> {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.users.findIndex((u) => u.id === user.id);
        if (idx !== -1) memoryStore.users[idx] = user;
        else memoryStore.users.push(user);
        return user;
      }
      await pool.query(
        `INSERT INTO users (id, username, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           avatar = EXCLUDED.avatar,
           nip_or_nisn = EXCLUDED.nip_or_nisn,
           phone = EXCLUDED.phone,
           assigned_class = EXCLUDED.assigned_class,
           grade_level = EXCLUDED.grade_level,
           active = EXCLUDED.active`,
        [user.id, user.username, user.name, user.email, user.role, user.avatar ?? null, user.nipOrNisn ?? '', user.phone ?? '', user.assignedClass ?? null, user.gradeLevel ?? null, user.active, user.createdAt]
      );
      return user;
    } catch (error) {
      console.error('saveUser failed:', error);
      throw new Error('Gagal menyimpan data pengguna.', { cause: error });
    }
  }

  static async deleteUsers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.users = memoryStore.users.filter((u) => !set.has(u.id));
        return;
      }
      await pool.query('DELETE FROM users WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteUsers failed:', error);
      throw new Error('Gagal menghapus data pengguna.', { cause: error });
    }
  }

  // STUDENTS
  static async saveStudent(s: Student): Promise<Student> {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.students.findIndex((x) => x.id === s.id);
        if (idx !== -1) memoryStore.students[idx] = s;
        else memoryStore.students.unshift(s);
        return s;
      }
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
        [s.id, s.nisn, s.nis, s.name, s.gender, s.classId, s.className, s.majorId, s.majorName, s.academicYear, s.parentName, s.parentPhone, s.studentPhone, s.address, s.status, s.counselingCount ?? 0, s.openCasesCount ?? 0]
      );
      return s;
    } catch (error) {
      console.error('saveStudent failed:', error);
      throw new Error('Gagal menyimpan data siswa.', { cause: error });
    }
  }

  static async importStudents(students: Student[]): Promise<void> {
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
      console.error('importStudents failed:', error);
      throw new Error('Gagal mengimpor data siswa.', { cause: error });
    }
  }

  static async deleteStudents(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.students = memoryStore.students.filter((s) => !set.has(s.id));
        return;
      }
      await pool.query('DELETE FROM students WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteStudents failed:', error);
      throw new Error('Gagal menghapus data siswa.', { cause: error });
    }
  }

  // TEACHERS
  static async saveTeacher(t: Teacher): Promise<Teacher> {
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
      console.error('saveTeacher failed:', error);
      throw new Error('Gagal menyimpan data guru.', { cause: error });
    }
  }

  static async deleteTeachers(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.teachers = memoryStore.teachers.filter((t) => !set.has(t.id));
        return;
      }
      await pool.query('DELETE FROM teachers WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteTeachers failed:', error);
      throw new Error('Gagal menghapus data guru.', { cause: error });
    }
  }

  // CLASSES
  static async saveClass(c: SchoolClass): Promise<SchoolClass> {
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const idx = memoryStore.classes.findIndex((x) => x.id === c.id);
        if (idx !== -1) memoryStore.classes[idx] = c;
        else memoryStore.classes.push(c);
        return c;
      }
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
        [c.id, c.name, c.grade, c.majorId, c.majorName, c.homeroomTeacherId ?? null, c.homeroomTeacherName ?? null, c.studentCount, c.academicYear]
      );
      return c;
    } catch (error) {
      console.error('saveClass failed:', error);
      throw new Error('Gagal menyimpan data kelas.', { cause: error });
    }
  }

  static async deleteClasses(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.classes = memoryStore.classes.filter((c) => !set.has(c.id));
        return;
      }
      await pool.query('DELETE FROM school_classes WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteClasses failed:', error);
      throw new Error('Gagal menghapus data kelas.', { cause: error });
    }
  }

  // COUNSELING SESSIONS
  static async saveCounselingSession(cs: CounselingSession): Promise<CounselingSession> {
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
        [cs.id, cs.ticketNumber, cs.studentId, cs.studentName, cs.studentClass, cs.counselorId, cs.counselorName, cs.type, cs.domain, cs.sessionDate, cs.sessionTime, cs.location, cs.status, cs.problemSummary, cs.confidentialNotes ?? '', cs.actionPlan ?? '', cs.outcomeSummary ?? '', cs.followUpDate ?? null, cs.createdAt]
      );
      return cs;
    } catch (error) {
      console.error('saveCounselingSession failed:', error);
      throw new Error('Gagal menyimpan sesi konseling.', { cause: error });
    }
  }

  static async deleteCounselingSessions(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.counselingSessions = memoryStore.counselingSessions.filter((s) => !set.has(s.id));
        return;
      }
      await pool.query('DELETE FROM counseling_sessions WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteCounselingSessions failed:', error);
      throw new Error('Gagal menghapus sesi konseling.', { cause: error });
    }
  }

  // REFERRALS
  static async saveReferral(r: Referral): Promise<Referral> {
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
        [r.id, r.referralNumber, r.studentId, r.studentName, r.studentClass, r.referredByTeacherId, r.referredByTeacherName, r.counselorId ?? null, r.counselorName ?? null, r.reason, JSON.stringify(r.indicators || []), r.urgency, r.status, r.counselorFeedback ?? '', r.createdAt, r.updatedAt]
      );
      return r;
    } catch (error) {
      console.error('saveReferral failed:', error);
      throw new Error('Gagal menyimpan data rujukan.', { cause: error });
    }
  }

  static async deleteReferrals(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.referrals = memoryStore.referrals.filter((r) => !set.has(r.id));
        return;
      }
      await pool.query('DELETE FROM referrals WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteReferrals failed:', error);
      throw new Error('Gagal menghapus data rujukan.', { cause: error });
    }
  }

  // CASES
  static async saveCase(c: StudentCase): Promise<StudentCase> {
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
        [c.id, c.caseNumber, c.title, c.studentId, c.studentName, c.studentClass, c.category, c.priority, c.status, c.assignedCounselorId, c.assignedCounselorName, c.incidentDate, c.chronologySummary, c.confidentialDetails ?? '', JSON.stringify(c.interventions || []), c.resolutionNotes ?? '', c.createdAt, c.updatedAt]
      );
      return c;
    } catch (error) {
      console.error('saveCase failed:', error);
      throw new Error('Gagal menyimpan data kasus.', { cause: error });
    }
  }

  static async deleteCases(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.cases = memoryStore.cases.filter((c) => !set.has(c.id));
        return;
      }
      await pool.query('DELETE FROM student_cases WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteCases failed:', error);
      throw new Error('Gagal menghapus data kasus.', { cause: error });
    }
  }

  // PROGRAMS
  static async saveProgram(p: BKProgram): Promise<BKProgram> {
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
      console.error('saveProgram failed:', error);
      throw new Error('Gagal menyimpan program BK.', { cause: error });
    }
  }

  static async deletePrograms(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.programs = memoryStore.programs.filter((p) => !set.has(p.id));
        return;
      }
      await pool.query('DELETE FROM bk_programs WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deletePrograms failed:', error);
      throw new Error('Gagal menghapus program BK.', { cause: error });
    }
  }

  // ASSESSMENTS
  static async saveSubmission(sub: AssessmentSubmission): Promise<AssessmentSubmission> {
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
        'UPDATE assessments SET submission_count = submission_count + 1 WHERE id = $1',
        [sub.assessmentId]
      );
      return sub;
    } catch (error) {
      console.error('saveSubmission failed:', error);
      throw new Error('Gagal menyimpan hasil asesmen.', { cause: error });
    }
  }

  // MATERIALS
  static async saveMaterial(m: BKMaterial): Promise<BKMaterial> {
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
        [m.id, m.title, m.domain, m.targetGrade, m.authorName, m.summary, m.content, m.hasTask, m.taskPrompt ?? '', m.createdAt, m.readCount]
      );
      return m;
    } catch (error) {
      console.error('saveMaterial failed:', error);
      throw new Error('Gagal menyimpan materi BK.', { cause: error });
    }
  }

  static async deleteMaterials(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.materials = memoryStore.materials.filter((m) => !set.has(m.id));
        return;
      }
      await pool.query('DELETE FROM bk_materials WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteMaterials failed:', error);
      throw new Error('Gagal menghapus materi BK.', { cause: error });
    }
  }

  // AUDIT LOGS
  static async addAuditLog(log: AuditLog): Promise<AuditLog> {
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
      console.error('addAuditLog failed:', error);
      throw new Error('Gagal mencatat audit log.', { cause: error });
    }
  }

  static async deleteAuditLogs(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      const pool = await ensureNeonReady();
      if (!pool) {
        const set = new Set(ids);
        memoryStore.auditLogs = memoryStore.auditLogs.filter((l) => !set.has(l.id));
        return;
      }
      await pool.query('DELETE FROM audit_logs WHERE id = ANY($1::text[])', [ids]);
    } catch (error) {
      console.error('deleteAuditLogs failed:', error);
      throw new Error('Gagal menghapus audit log.', { cause: error });
    }
  }
}
