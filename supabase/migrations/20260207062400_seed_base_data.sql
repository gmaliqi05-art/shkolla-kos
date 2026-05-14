/*
  # Seed Base School Data

  1. Data Seeded
    - Active academic year 2025-2026
    - 12 core subjects for Albanian elementary/middle school
    - 18 classes (Klasa 1A through 9B)

  2. Notes
    - Subjects include standard Albanian curriculum
    - Classes cover all grades 1-9 with sections A and B
    - Academic year linked to all classes
*/

INSERT INTO academic_years (id, name, start_date, end_date, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '2025-2026',
  '2025-09-15',
  '2026-06-15',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO subjects (id, name, code, description) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Matematike', 'MAT', 'Matematika dhe gjeometria'),
  ('b0000000-0000-0000-0000-000000000002', 'Gjuhe Shqipe', 'GJSH', 'Gjuha shqipe dhe letersia'),
  ('b0000000-0000-0000-0000-000000000003', 'Histori', 'HIS', 'Historia e Shqiperise dhe botes'),
  ('b0000000-0000-0000-0000-000000000004', 'Gjeografi', 'GJE', 'Gjeografia fizike dhe humane'),
  ('b0000000-0000-0000-0000-000000000005', 'Biologji', 'BIO', 'Biologjia dhe shkencat natyrore'),
  ('b0000000-0000-0000-0000-000000000006', 'Fizike', 'FIZ', 'Fizika dhe eksperimentet'),
  ('b0000000-0000-0000-0000-000000000007', 'Kimi', 'KIM', 'Kimia dhe laboratori'),
  ('b0000000-0000-0000-0000-000000000008', 'Anglisht', 'ANG', 'Gjuha angleze'),
  ('b0000000-0000-0000-0000-000000000009', 'Edukim Fizik', 'EF', 'Edukimi fizik dhe sporti'),
  ('b0000000-0000-0000-0000-000000000010', 'Art Pamor', 'ART', 'Arti pamor dhe vizatimi'),
  ('b0000000-0000-0000-0000-000000000011', 'Muzike', 'MUZ', 'Edukimi muzikor'),
  ('b0000000-0000-0000-0000-000000000012', 'TIK', 'TIK', 'Teknologjia e informacionit')
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, name, grade_level, section, academic_year_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Klasa 1-A', 1, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'Klasa 1-B', 1, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'Klasa 2-A', 2, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000004', 'Klasa 2-B', 2, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000005', 'Klasa 3-A', 3, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000006', 'Klasa 3-B', 3, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000007', 'Klasa 4-A', 4, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000008', 'Klasa 4-B', 4, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000009', 'Klasa 5-A', 5, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000010', 'Klasa 5-B', 5, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000011', 'Klasa 6-A', 6, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000012', 'Klasa 6-B', 6, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000013', 'Klasa 7-A', 7, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000014', 'Klasa 7-B', 7, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000015', 'Klasa 8-A', 8, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000016', 'Klasa 8-B', 8, 'B', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000017', 'Klasa 9-A', 9, 'A', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000018', 'Klasa 9-B', 9, 'B', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;