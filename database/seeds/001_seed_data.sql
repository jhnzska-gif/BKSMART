-- ==============================================================================
-- BKSmart Seed Data
-- Only default Administrator account (admin / admin123) is seeded.
-- ==============================================================================

INSERT INTO users (id, username, password_hash, name, email, role, avatar, nip_or_nisn, phone, assigned_class, grade_level, active, created_at)
VALUES (
  'u-1',
  'admin',
  '',
  'Administrator BKSmart',
  'admin@bksmart.sch.id',
  'admin',
  NULL,
  '',
  '',
  NULL,
  NULL,
  TRUE,
  '2024-01-10T08:00:00Z'
)
ON CONFLICT (id) DO NOTHING;
