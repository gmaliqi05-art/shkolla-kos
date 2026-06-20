/*
  # Korniza Kurrikulare e Kosovës (KKK): fushat kurrikulare + kompetencat

  Shton strukturën që mungonte nga KKK:
  1. curricular_areas — 7 fushat kurrikulare; lëndët lidhen me to.
  2. competencies — 7 kompetencat kryesore.
  3. student_competency_assessments — vlerësimi i nxënësit sipas kompetencave
     (4 nivele arritjeje, sipas periudhës).

  Rezultatet e të Nxënit (RNL) për lëndë/shkallë do të shtohen veçmas (përmbajtje
  e madhe kurrikulare).
*/

-- 1) FUSHAT KURRIKULARE
CREATE TABLE IF NOT EXISTS curricular_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO curricular_areas (code, name, sort_order) VALUES
  ('GJK', 'Gjuhët dhe komunikimi', 1),
  ('ART', 'Artet', 2),
  ('MAT', 'Matematika', 3),
  ('SHN', 'Shkencat e natyrës', 4),
  ('SHM', 'Shoqëria dhe mjedisi', 5),
  ('EFS', 'Edukata fizike, sportet dhe shëndeti', 6),
  ('JP',  'Jeta dhe puna', 7)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS curricular_area_id uuid REFERENCES curricular_areas(id) ON DELETE SET NULL;

-- Lidh lëndët ekzistuese me fushat (sipas kodit të lëndës)
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'GJK' AND s.code IN ('GJSH', 'ANG', 'FRA', 'GJE2');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'ART' AND s.code IN ('ART', 'MUZ');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'MAT' AND s.code IN ('MAT');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'SHN' AND s.code IN ('BIO', 'FIZ', 'KIM', 'SHN', 'NSH');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'SHM' AND s.code IN ('HIS', 'GJE', 'EQ');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'EFS' AND s.code IN ('EF');
UPDATE subjects s SET curricular_area_id = a.id FROM curricular_areas a
  WHERE a.code = 'JP' AND s.code IN ('TIK');

ALTER TABLE curricular_areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read curricular_areas" ON curricular_areas;
CREATE POLICY "Authenticated read curricular_areas" ON curricular_areas
  FOR SELECT TO authenticated USING (true);

-- 2) KOMPETENCAT KRYESORE
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

INSERT INTO competencies (code, name, description, sort_order) VALUES
  ('KOM', 'Komunikues efektiv', 'Kompetenca e komunikimit', 1),
  ('KRE', 'Mendimtar kreativ', 'Kompetenca e të menduarit', 2),
  ('NXS', 'Nxënës i suksesshëm', 'Kompetenca e të nxënit', 3),
  ('KON', 'Kontribues produktiv', 'Kompetenca për jetë, punë dhe mjedis', 4),
  ('IND', 'Individ i shëndoshë', 'Kompetenca personale', 5),
  ('QYT', 'Qytetar i përgjegjshëm', 'Kompetenca qytetare', 6),
  ('DIG', 'Kompetenca digjitale', 'Përdorimi i teknologjisë', 7)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read competencies" ON competencies;
CREATE POLICY "Authenticated read competencies" ON competencies
  FOR SELECT TO authenticated USING (true);

-- 3) VLERËSIMI SIPAS KOMPETENCAVE
CREATE TABLE IF NOT EXISTS student_competency_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  period integer NOT NULL CHECK (period IN (1, 2, 3)),
  level text NOT NULL CHECK (level IN ('fillestar', 'ne_zhvillim', 'i_arritur', 'i_avancuar')),
  notes text DEFAULT '',
  assessed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assessed_at timestamptz DEFAULT now(),
  UNIQUE (student_id, competency_id, period)
);

CREATE INDEX IF NOT EXISTS sca_student_idx ON student_competency_assessments(student_id);

ALTER TABLE student_competency_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff assess competencies" ON student_competency_assessments;
CREATE POLICY "Staff assess competencies" ON student_competency_assessments
  FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('mesues', 'drejtor', 'pedagog')
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = student_competency_assessments.student_id AND p.school_id = public.current_user_school_id())
  )
  WITH CHECK (
    public.current_user_role() IN ('mesues', 'drejtor', 'pedagog')
    AND assessed_by = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = student_competency_assessments.student_id AND p.school_id = public.current_user_school_id())
  );

DROP POLICY IF EXISTS "Student reads own competencies" ON student_competency_assessments;
CREATE POLICY "Student reads own competencies" ON student_competency_assessments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parent reads child competencies" ON student_competency_assessments;
CREATE POLICY "Parent reads child competencies" ON student_competency_assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM parent_students ps WHERE ps.student_id = student_competency_assessments.student_id AND ps.parent_id = auth.uid())
  );
