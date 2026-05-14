/*
  # Seed Kosovo Curriculum Subjects by Grade Level

  ## Summary
  Adds all subjects used in Kosovo's elementary and middle school system (grades 1-9)
  according to the Kosovo Curriculum Framework (KKK - Korniza Kurrikulare e Kosovës).

  ## Subject-Grade Assignments
  - Grades 1-3 (Cikli i ulët): Core subjects (Albanian, Math, Nature & Society, Art, Music, PE, ICT)
  - Grades 4-5 (Cikli i mesëm i ulët): Adds English, History, Geography
  - Grades 6-9 (Cikli i mesëm i lartë): Adds Biology, Physics, Chemistry, Civic Education, German

  ## New Tables
  - `subject_grades` — maps which subjects belong to which grade levels

  ## Security
  - RLS enabled
  - Read access for all authenticated users
  - Write access for directors only
*/

CREATE TABLE IF NOT EXISTS subject_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level integer NOT NULL CHECK (grade_level BETWEEN 1 AND 9),
  hours_per_week integer NOT NULL DEFAULT 2,
  UNIQUE(subject_id, grade_level)
);

ALTER TABLE subject_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subject grades"
  ON subject_grades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Directors can insert subject grades"
  ON subject_grades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'drejtor'
    )
  );

CREATE POLICY "Directors can update subject grades"
  ON subject_grades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'drejtor')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'drejtor')
  );

CREATE POLICY "Directors can delete subject grades"
  ON subject_grades FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'drejtor')
  );

-- Add additional subjects not in the original seed
INSERT INTO subjects (id, name, code, description) VALUES
  ('b0000000-0000-0000-0000-000000000013', 'Natyra dhe Shoqeria', 'NSH', 'Natyra dhe shoqeria per klasa 1-3'),
  ('b0000000-0000-0000-0000-000000000014', 'Edukate Qytetare', 'EQ', 'Edukate qytetare dhe te drejtat'),
  ('b0000000-0000-0000-0000-000000000015', 'Gjermanisht', 'GJE2', 'Gjuha gjermane si gjuhe e dyte'),
  ('b0000000-0000-0000-0000-000000000016', 'Franc\u00ebzisht', 'FRA', 'Gjuha frenge'),
  ('b0000000-0000-0000-0000-000000000017', 'Shkencat e Natyres', 'SHN', 'Shkencat e natyres klasa 4-5'),
  ('b0000000-0000-0000-0000-000000000018', 'Fet\u00eb dhe Kultura', 'FK', 'Fete dhe kultura')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- GRADE 1 subjects (Klasa 1)
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 1, 7), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 1, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000013', 1, 3), -- Natyra dhe Shoqeria
  ('b0000000-0000-0000-0000-000000000009', 1, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 1, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 1, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 1, 1)  -- TIK
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 2 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 2, 7), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 2, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000013', 2, 3), -- Natyra dhe Shoqeria
  ('b0000000-0000-0000-0000-000000000009', 2, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 2, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 2, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 2, 1)  -- TIK
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 3 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 3, 7), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 3, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000013', 3, 2), -- Natyra dhe Shoqeria
  ('b0000000-0000-0000-0000-000000000008', 3, 2), -- Anglisht
  ('b0000000-0000-0000-0000-000000000009', 3, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 3, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 3, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 3, 1)  -- TIK
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 4 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 4, 6), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 4, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000017', 4, 2), -- Shkencat e Natyres
  ('b0000000-0000-0000-0000-000000000008', 4, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 4, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 4, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000009', 4, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 4, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 4, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 4, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000018', 4, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 5 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 5, 5), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 5, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000017', 5, 2), -- Shkencat e Natyres
  ('b0000000-0000-0000-0000-000000000008', 5, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 5, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 5, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000014', 5, 1), -- Edukate Qytetare
  ('b0000000-0000-0000-0000-000000000009', 5, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 5, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 5, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 5, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000018', 5, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 6 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 6, 4), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 6, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000005', 6, 2), -- Biologji
  ('b0000000-0000-0000-0000-000000000008', 6, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 6, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 6, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000014', 6, 1), -- Edukate Qytetare
  ('b0000000-0000-0000-0000-000000000009', 6, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 6, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 6, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 6, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000015', 6, 2), -- Gjermanisht
  ('b0000000-0000-0000-0000-000000000018', 6, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 7 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 7, 4), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 7, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000005', 7, 2), -- Biologji
  ('b0000000-0000-0000-0000-000000000006', 7, 2), -- Fizike
  ('b0000000-0000-0000-0000-000000000008', 7, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 7, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 7, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000014', 7, 1), -- Edukate Qytetare
  ('b0000000-0000-0000-0000-000000000009', 7, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 7, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 7, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 7, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000015', 7, 2), -- Gjermanisht
  ('b0000000-0000-0000-0000-000000000018', 7, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 8 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 8, 4), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 8, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000005', 8, 2), -- Biologji
  ('b0000000-0000-0000-0000-000000000006', 8, 2), -- Fizike
  ('b0000000-0000-0000-0000-000000000007', 8, 2), -- Kimi
  ('b0000000-0000-0000-0000-000000000008', 8, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 8, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 8, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000014', 8, 1), -- Edukate Qytetare
  ('b0000000-0000-0000-0000-000000000009', 8, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 8, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 8, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 8, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000015', 8, 2), -- Gjermanisht
  ('b0000000-0000-0000-0000-000000000018', 8, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;

-- ============================================================
-- GRADE 9 subjects
-- ============================================================
INSERT INTO subject_grades (subject_id, grade_level, hours_per_week) VALUES
  ('b0000000-0000-0000-0000-000000000002', 9, 4), -- Gjuhe Shqipe
  ('b0000000-0000-0000-0000-000000000001', 9, 4), -- Matematike
  ('b0000000-0000-0000-0000-000000000005', 9, 2), -- Biologji
  ('b0000000-0000-0000-0000-000000000006', 9, 2), -- Fizike
  ('b0000000-0000-0000-0000-000000000007', 9, 2), -- Kimi
  ('b0000000-0000-0000-0000-000000000008', 9, 3), -- Anglisht
  ('b0000000-0000-0000-0000-000000000003', 9, 2), -- Histori
  ('b0000000-0000-0000-0000-000000000004', 9, 2), -- Gjeografi
  ('b0000000-0000-0000-0000-000000000014', 9, 2), -- Edukate Qytetare
  ('b0000000-0000-0000-0000-000000000009', 9, 2), -- Edukim Fizik
  ('b0000000-0000-0000-0000-000000000010', 9, 1), -- Art Pamor
  ('b0000000-0000-0000-0000-000000000011', 9, 1), -- Muzike
  ('b0000000-0000-0000-0000-000000000012', 9, 1), -- TIK
  ('b0000000-0000-0000-0000-000000000015', 9, 2), -- Gjermanisht
  ('b0000000-0000-0000-0000-000000000018', 9, 1)  -- Fete dhe Kultura
ON CONFLICT (subject_id, grade_level) DO NOTHING;
