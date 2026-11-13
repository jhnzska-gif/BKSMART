-- ==============================================================================
-- BKSmart Seed Data (SMK Merdeka Nusantara)
-- ==============================================================================

-- 1. Users for all 5 roles
INSERT INTO users (id, username, password_hash, name, email, role, nip_or_nisn, phone, assigned_class, active) VALUES
('u-1', 'admin', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Drs. Bambang Hidayat, M.Kom', 'admin@bksmart.sch.id', 'admin', '197805122003121002', '0812-3456-7890', NULL, true),
('u-2', 'gurubk', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Siti Rahmawati, S.Pd., Kons.', 'siti.rahma@bksmart.sch.id', 'counselor', '198509152010012015', '0813-8899-7722', NULL, true),
('u-3', 'walikelas', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Ahmad Fauzi, S.Pd.', 'ahmad.fauzi@bksmart.sch.id', 'teacher', '198802202015041003', '0852-1122-3344', 'XI RPL 1', true),
('u-4', 'siswa', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Rizky Pratama', 'rizky.pratama@siswa.sch.id', 'student', '0067829102', '0896-7788-9900', 'XI RPL 1', true),
('u-5', 'kepsek', '$2a$10$abcdefghijklmnopqrstuvwxyz123456', 'Dr. H. Mulyono, M.Pd.', 'mulyono.kepsek@bksmart.sch.id', 'principal', '196904121994031001', '0811-9988-7766', NULL, true)
ON CONFLICT (id) DO NOTHING;

-- 2. Majors
INSERT INTO majors (id, code, name, head_of_major) VALUES
('m-1', 'RPL', 'Rekayasa Perangkat Lunak', 'Ir. Hendra Wijaya'),
('m-2', 'TKJ', 'Teknik Komputer dan Jaringan', 'Agus Santoso, S.T.'),
('m-3', 'DKV', 'Desain Komunikasi Visual', 'Dewi Lestari, M.Sn.'),
('m-4', 'AKL', 'Akuntansi dan Keuangan Lembaga', 'Sri Wahyuni, S.E.')
ON CONFLICT (id) DO NOTHING;

-- 3. Classes
INSERT INTO school_classes (id, name, grade, major_id, homeroom_teacher_id, student_count, academic_year) VALUES
('c-1', 'X RPL 1', '10', 'm-1', NULL, 36, '2024/2025'),
('c-2', 'XI RPL 1', '11', 'm-1', 'u-3', 35, '2024/2025'),
('c-3', 'XII RPL 1', '12', 'm-1', NULL, 34, '2024/2025'),
('c-4', 'X TKJ 1', '10', 'm-2', NULL, 36, '2024/2025')
ON CONFLICT (id) DO NOTHING;

-- 4. Students
INSERT INTO students (id, nisn, nis, name, gender, class_id, major_id, academic_year, parent_name, parent_phone, student_phone, address, status) VALUES
('s-1', '0067829102', '2324101', 'Rizky Pratama', 'L', 'c-2', 'm-1', '2024/2025', 'H. Sudirman', '0812-9900-1122', '0896-7788-9900', 'Jl. Melati No. 14, Jakarta', 'active'),
('s-2', '0071234567', '2324102', 'Anisa Maharani', 'P', 'c-2', 'm-1', '2024/2025', 'Bambang Supriyadi', '0813-4455-6677', '0878-1122-3344', 'Jl. Dahlia Blok C3 No. 8', 'active'),
('s-3', '0069988771', '2324103', 'Dimas Bagus Saputra', 'L', 'c-2', 'm-1', '2024/2025', 'Gunawan Saputra', '0852-6677-8899', '0856-2233-4455', 'Jl. Merpati II No. 19', 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Counseling Sessions
INSERT INTO counseling_sessions (id, ticket_number, student_id, counselor_id, counseling_type, domain, session_date, session_time, location, status, problem_summary, confidential_notes, action_plan) VALUES
('cs-1', 'BK-2025-001', 's-1', 'u-2', 'individual', 'karier', '2025-02-14', '09:30:00', 'Ruang BK - Konseling Individu 1', 'completed', 'Konsultasi rencana PKL industri dan pemilihan perguruan tinggi.', 'Siswa memiliki minat kuat di web development. Mengalami keraguan antara langsung bekerja membantu ekonomi keluarga atau kuliah.', 'Membantu siswa menyusun portofolio GitHub dan mendaftar program magang.')
ON CONFLICT (id) DO NOTHING;
