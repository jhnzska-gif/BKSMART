-- ==============================================================================
-- BKSmart Seed Data
-- Starter login accounts for all 5 RBAC roles (admin, gurubk, walikelas, siswa, kepsek).
-- Operational school data (students, classes, teachers, counseling, cases) starts empty.
-- ==============================================================================

INSERT INTO users (id, username, password_hash, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
VALUES
  ('u-1', 'admin', '', 'Administrator BKSmart', 'admin@bksmart.sch.id', 'admin', NULL, '', '', NULL, NULL, TRUE, '2024-01-10T08:00:00Z'),
  ('u-2', 'gurubk', '', 'Guru BK (Konselor)', 'gurubk@bksmart.sch.id', 'counselor', NULL, '', '', NULL, NULL, TRUE, '2024-01-10T08:05:00Z'),
  ('u-3', 'walikelas', '', 'Guru / Wali Kelas', 'walikelas@bksmart.sch.id', 'teacher', NULL, '', '', NULL, NULL, TRUE, '2024-01-10T08:10:00Z'),
  ('u-4', 'siswa', '', 'Akun Siswa', 'siswa@bksmart.sch.id', 'student', NULL, '', '', NULL, NULL, TRUE, '2024-01-10T08:15:00Z'),
  ('u-5', 'kepsek', '', 'Kepala Sekolah', 'kepsek@bksmart.sch.id', 'principal', NULL, '', '', NULL, NULL, TRUE, '2024-01-10T08:20:00Z')
ON CONFLICT (id) DO NOTHING;
