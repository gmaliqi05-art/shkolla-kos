/*
  # Paketa 8: Testet Kombëtare të Arritshmërisë

  Përputhshmëri me:
  - UA për Testin e Arritshmërisë i Klasës së V-të
  - UA për Testin e Arritshmërisë i Klasës së IX-të
  - MAShTI/MASA — institucioni testues

  Çfarë shton:
  1. national_tests — testet e organizuara (V-të dhe IX-të)
  2. national_test_results — rezultatet e nxënësve sipas lëndëve
*/

-- =============================================================================
-- 1) NATIONAL_TESTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS national_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level integer NOT NULL CHECK (grade_level IN (5, 9)),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  test_date date NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'planifikuar' CHECK (status IN ('planifikuar', 'mbajtur', 'rezultatet_marrura', 'perfunduar')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS national_tests_grade_idx ON national_tests(grade_level);
CREATE INDEX IF NOT EXISTS national_tests_date_idx ON national_tests(test_date DESC);

ALTER TABLE national_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages national_tests" ON national_tests;
CREATE POLICY "Director manages national_tests"
  ON national_tests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "All authenticated read national_tests" ON national_tests;
CREATE POLICY "All authenticated read national_tests"
  ON national_tests FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- 2) NATIONAL_TEST_RESULTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS national_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES national_tests(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name text NOT NULL,
  score numeric(6,2),
  max_score numeric(6,2),
  percentage numeric(5,2),
  level text CHECK (level IS NULL OR level IN ('shkelqyeshem', 'shume_mire', 'mire', 'kenaqshem', 'pakenaqshem')),
  notes text DEFAULT '',
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  recorded_at timestamptz DEFAULT now(),
  UNIQUE (test_id, student_id, subject_name)
);

CREATE INDEX IF NOT EXISTS test_results_test_idx ON national_test_results(test_id);
CREATE INDEX IF NOT EXISTS test_results_student_idx ON national_test_results(student_id);

ALTER TABLE national_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages test_results" ON national_test_results;
CREATE POLICY "Director manages test_results"
  ON national_test_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Students read own test_results" ON national_test_results;
CREATE POLICY "Students read own test_results"
  ON national_test_results FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child test_results" ON national_test_results;
CREATE POLICY "Parents read child test_results"
  ON national_test_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = national_test_results.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers read class test_results" ON national_test_results;
CREATE POLICY "Teachers read class test_results"
  ON national_test_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = national_test_results.student_id
        AND c.homeroom_teacher_id = auth.uid()
    )
  );
