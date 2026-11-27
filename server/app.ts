import express from 'express';
import { ensureNeonReady, isNeonConfigured } from './db.ts';
import { BKSmartRepository } from './repository.ts';

export function createApiApp(): express.Express {
  const app = express();
  const jsonParser = express.json({ limit: '5mb' });

  app.use((req, res, next) => {
    if (
      req.body !== undefined &&
      req.body !== null &&
      typeof req.body === 'object' &&
      !Buffer.isBuffer(req.body)
    ) {
      return next();
    }
    if (req.readable === false && req.body !== undefined) {
      return next();
    }
    return jsonParser(req, res, next);
  });

  // Health Check Endpoint
  app.get('/api/health', async (_req, res) => {
    try {
      const pool = await ensureNeonReady();
      if (pool) {
        const countRes = await pool.query(
          "SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public'"
        );
        res.json({
          status: 'ok',
          database: 'neondb',
          connected: true,
          tablesCount: countRes.rows[0]?.count ?? 0,
        });
        return;
      }
      res.json({
        status: 'ok',
        database: 'memory_fallback',
        connected: true,
        configured: false,
      });
    } catch (error) {
      console.error('Health check database error:', error);
      res.status(503).json({
        status: 'error',
        database: isNeonConfigured() ? 'neondb' : 'memory_fallback',
        connected: false,
        message: error instanceof Error ? error.message : 'Koneksi database belum siap.',
      });
    }
  });

  // Bootstrap all collections with server-side RBAC confidential redaction
  app.get('/api/bootstrap', async (req, res) => {
    try {
      const roleHeader = req.headers['x-user-role'];
      const data = await BKSmartRepository.getBootstrap(roleHeader);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  });

  // AUTHENTICATION
  app.post('/api/auth/login', async (req, res) => {
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!username || !password) {
        res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
        return;
      }
      const user = await BKSmartRepository.authenticateUser(username, password);
      if (!user) {
        res.status(401).json({ error: 'Username atau kata sandi tidak sesuai.' });
        return;
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal memproses login' });
    }
  });

  // USERS
  app.post('/api/users', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveUser(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan pengguna' });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteUsers([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus pengguna' });
    }
  });

  app.post('/api/users/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteUsers(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus pengguna terpilih' });
    }
  });

  // STUDENTS
  app.post('/api/students', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveStudent(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan siswa' });
    }
  });

  app.post('/api/students/import', async (req, res) => {
    try {
      const students = Array.isArray(req.body?.students) ? req.body.students : [];
      await BKSmartRepository.importStudents(students);
      res.json({ ok: true, count: students.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal mengimpor siswa' });
    }
  });

  app.delete('/api/students/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteStudents([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus siswa' });
    }
  });

  app.post('/api/students/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteStudents(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus siswa terpilih' });
    }
  });

  // TEACHERS
  app.post('/api/teachers', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveTeacher(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan guru' });
    }
  });

  app.delete('/api/teachers/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteTeachers([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus guru' });
    }
  });

  app.post('/api/teachers/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteTeachers(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus guru terpilih' });
    }
  });

  // CLASSES
  app.post('/api/classes', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveClass(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan kelas' });
    }
  });

  app.delete('/api/classes/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteClasses([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus kelas' });
    }
  });

  app.post('/api/classes/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteClasses(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus kelas terpilih' });
    }
  });

  // MAJORS
  app.post('/api/majors', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveMajor(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan jurusan' });
    }
  });

  app.delete('/api/majors/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteMajors([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus jurusan' });
    }
  });

  // ACADEMIC YEARS
  app.post('/api/academic-years', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveAcademicYear(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran' });
    }
  });

  app.delete('/api/academic-years/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteAcademicYears([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus tahun ajaran' });
    }
  });

  // COUNSELING SESSIONS
  app.post('/api/counseling-sessions', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveCounselingSession(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan sesi konseling' });
    }
  });

  app.delete('/api/counseling-sessions/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteCounselingSessions([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus sesi konseling' });
    }
  });

  app.post('/api/counseling-sessions/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteCounselingSessions(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus sesi konseling terpilih' });
    }
  });

  // REFERRALS
  app.post('/api/referrals', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveReferral(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan rujukan' });
    }
  });

  app.delete('/api/referrals/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteReferrals([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus rujukan' });
    }
  });

  app.post('/api/referrals/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteReferrals(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus rujukan terpilih' });
    }
  });

  // CASES
  app.post('/api/cases', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveCase(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan kasus' });
    }
  });

  app.delete('/api/cases/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteCases([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus kasus' });
    }
  });

  app.post('/api/cases/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteCases(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus kasus terpilih' });
    }
  });

  // PROGRAMS
  app.post('/api/programs', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveProgram(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan program BK' });
    }
  });

  app.delete('/api/programs/:id', async (req, res) => {
    try {
      await BKSmartRepository.deletePrograms([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus program BK' });
    }
  });

  app.post('/api/programs/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deletePrograms(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus program BK terpilih' });
    }
  });

  // ASSESSMENTS
  app.post('/api/assessments/submit', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveSubmission(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan jawaban asesmen' });
    }
  });

  // MATERIALS
  app.post('/api/materials', async (req, res) => {
    try {
      const saved = await BKSmartRepository.saveMaterial(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan materi BK' });
    }
  });

  app.delete('/api/materials/:id', async (req, res) => {
    try {
      await BKSmartRepository.deleteMaterials([req.params.id]);
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus materi BK' });
    }
  });

  app.post('/api/materials/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteMaterials(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus materi BK terpilih' });
    }
  });

  // AUDIT LOGS
  app.post('/api/audit-logs', async (req, res) => {
    try {
      const saved = await BKSmartRepository.addAuditLog(req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal mencatat audit log' });
    }
  });

  app.post('/api/audit-logs/batch-delete', async (req, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await BKSmartRepository.deleteAuditLogs(ids);
      res.json({ ok: true, count: ids.length });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal menghapus audit log terpilih' });
    }
  });

  // ADMIN BACKUP & RESTORE
  app.get('/api/admin/backup', async (req, res) => {
    try {
      const roleHeader = String(req.headers['x-user-role'] || '').toLowerCase();
      if (roleHeader && roleHeader !== 'admin') {
        res.status(403).json({ error: 'Hanya Admin yang dapat membuat backup penuh database.' });
        return;
      }
      const snapshot = await BKSmartRepository.createBackupSnapshot();
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal membuat backup database' });
    }
  });

  app.post('/api/admin/restore', async (req, res) => {
    try {
      const roleHeader = String(req.headers['x-user-role'] || '').toLowerCase();
      if (roleHeader && roleHeader !== 'admin') {
        res.status(403).json({ error: 'Hanya Admin yang dapat melakukan restore database.' });
        return;
      }
      const counts = await BKSmartRepository.restoreBackupSnapshot(req.body || {});
      res.json({ ok: true, counts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Gagal memulihkan database dari backup' });
    }
  });

  // JSON fallback error handler for /api/* routes
  app.use('/api', (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API middleware error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Terjadi kesalahan internal server API.',
    });
  });

  return app;
}
