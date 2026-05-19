/*
  # Paketa 1: Të Dhënat Personale dhe Sjellja

  Përputhshmëria me ligjet e Kosovës:
  - Ligji Nr. 04/L-032 për Arsimin Parauniversitar (Amza / Regjistri Amzë)
  - UA Nr. 06/2022 për Vlerësimin e Nxënësve (Sjellja)
  - UA Nr. 19/2018 për Dokumentacionin Pedagogjik (të dhënat e plota)
  - Udhëzimet për Disiplinën Shkollore (masat disiplinore)

  Ndryshime:
  1. Profili (profiles) — shton fushat e detyrueshme për Amzën dhe sigurinë:
     - personal_number (numri personal 10-shifror)
     - date_of_birth, place_of_birth, address, gender, nationality
     - mother_tongue (gjuha amtare)
     - legal_guardian_name, legal_guardian_relation
     - emergency_contact_name/phone/relation
     - medical_conditions, family_doctor
     - enrollment_status (regjistruar/transferuar/perfunduar/larguar)

  2. behavior_assessments — vlerësimi i sjelljes për periudhë
     - 5 nivele: Shembullor / Shumë mirë / Mirë / I kënaqshëm / Jo i kënaqshëm
     - Një vlerësim për nxënës për periudhë për klasë

  3. disciplinary_actions — masat disiplinore
     - Vërejtje me gojë, me shkrim, largim i përkohshëm, transferim, largim përfundimtar

  Siguria:
  - RLS aktivizuar në të dyja tabelat e reja.
  - Politikat kufizojnë qasjen: nxënësi/prindi sheh të vetën, mësuesi shkruan/lexon për klasat e veta, drejtori sheh gjithçka.
*/

-- =============================================================================
-- 1) PROFILES: shto fusha të reja për Amzën dhe sigurinë
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS personal_number text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS place_of_birth text DEFAULT '',
  ADD COLUMN IF NOT EXISTS address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mother_tongue text DEFAULT 'shqip',
  ADD COLUMN IF NOT EXISTS legal_guardian_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS legal_guardian_relation text DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text DEFAULT '',
  ADD COLUMN IF NOT EXISTS medical_conditions text DEFAULT '',
  ADD COLUMN IF NOT EXISTS family_doctor text DEFAULT '',
  ADD COLUMN IF NOT EXISTS enrollment_status text DEFAULT 'regjistruar';

-- Constraint: numri personal 10-shifror (vetëm shifra), unik kur është i dhënë.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_personal_number_format_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_personal_number_format_check
      CHECK (personal_number IS NULL OR personal_number ~ '^[0-9]{10}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_personal_number_unique_idx
  ON profiles (personal_number)
  WHERE personal_number IS NOT NULL;

-- Constraint: gjinia në vlera të lejuara
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_gender_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_gender_check
      CHECK (gender IS NULL OR gender IN ('M', 'F', 'tjeter'));
  END IF;
END $$;

-- Constraint: statusi i regjistrimit
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_enrollment_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_enrollment_status_check
      CHECK (enrollment_status IN ('regjistruar', 'transferuar', 'perfunduar', 'larguar'));
  END IF;
END $$;

-- =============================================================================
-- 2) BEHAVIOR_ASSESSMENTS: Sjellja sipas UA 06/2022
-- =============================================================================

CREATE TABLE IF NOT EXISTS behavior_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  period integer NOT NULL CHECK (period IN (1, 2, 3)),
  level text NOT NULL CHECK (level IN ('shembullor', 'shume_mire', 'mire', 'kenaqshem', 'jo_kenaqshem')),
  comment text DEFAULT '',
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, class_id, period)
);

CREATE INDEX IF NOT EXISTS behavior_assessments_student_idx ON behavior_assessments(student_id);
CREATE INDEX IF NOT EXISTS behavior_assessments_class_idx ON behavior_assessments(class_id);

ALTER TABLE behavior_assessments ENABLE ROW LEVEL SECURITY;

-- Drejtori sheh dhe menaxhon gjithçka
DROP POLICY IF EXISTS "Director full access on behavior_assessments" ON behavior_assessments;
CREATE POLICY "Director full access on behavior_assessments"
  ON behavior_assessments
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Mësuesi: lexon për klasat e veta + shkruan për nxënësit e klasës ku është ngarkuar
DROP POLICY IF EXISTS "Teachers read own classes behavior" ON behavior_assessments;
CREATE POLICY "Teachers read own classes behavior"
  ON behavior_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_subjects
      WHERE class_subjects.class_id = behavior_assessments.class_id
        AND class_subjects.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = behavior_assessments.class_id
        AND classes.homeroom_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers write own classes behavior" ON behavior_assessments;
CREATE POLICY "Teachers write own classes behavior"
  ON behavior_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM class_subjects
        WHERE class_subjects.class_id = behavior_assessments.class_id
          AND class_subjects.teacher_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = behavior_assessments.class_id
          AND classes.homeroom_teacher_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Teachers update own behavior records" ON behavior_assessments;
CREATE POLICY "Teachers update own behavior records"
  ON behavior_assessments
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- Nxënësi: sheh të vetën
DROP POLICY IF EXISTS "Students read own behavior" ON behavior_assessments;
CREATE POLICY "Students read own behavior"
  ON behavior_assessments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Prindi: sheh të fëmijëve të vet
DROP POLICY IF EXISTS "Parents read child behavior" ON behavior_assessments;
CREATE POLICY "Parents read child behavior"
  ON behavior_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = behavior_assessments.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

-- =============================================================================
-- 3) DISCIPLINARY_ACTIONS: masat disiplinore
-- =============================================================================

CREATE TABLE IF NOT EXISTS disciplinary_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN (
    'verejtje_goje',
    'verejtje_shkrim',
    'largim_perkohshem',
    'transferim',
    'largim_perfundimtar'
  )),
  description text NOT NULL,
  action_date date NOT NULL DEFAULT CURRENT_DATE,
  issued_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  status text NOT NULL DEFAULT 'aktive' CHECK (status IN ('aktive', 'shfuqizuar', 'permbushur')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS disciplinary_actions_student_idx ON disciplinary_actions(student_id);
CREATE INDEX IF NOT EXISTS disciplinary_actions_date_idx ON disciplinary_actions(action_date DESC);

ALTER TABLE disciplinary_actions ENABLE ROW LEVEL SECURITY;

-- Drejtori sheh dhe menaxhon gjithçka
DROP POLICY IF EXISTS "Director full access on disciplinary_actions" ON disciplinary_actions;
CREATE POLICY "Director full access on disciplinary_actions"
  ON disciplinary_actions
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Mësuesi: lexon për klasat e veta; vendos masa të lehta (vetëm verejtje_goje / verejtje_shkrim)
DROP POLICY IF EXISTS "Teachers read class disciplinary" ON disciplinary_actions;
CREATE POLICY "Teachers read class disciplinary"
  ON disciplinary_actions
  FOR SELECT
  TO authenticated
  USING (
    issued_by = auth.uid()
    OR (
      class_id IS NOT NULL
      AND (
        EXISTS (
          SELECT 1 FROM class_subjects
          WHERE class_subjects.class_id = disciplinary_actions.class_id
            AND class_subjects.teacher_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM classes
          WHERE classes.id = disciplinary_actions.class_id
            AND classes.homeroom_teacher_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Teachers insert minor disciplinary" ON disciplinary_actions;
CREATE POLICY "Teachers insert minor disciplinary"
  ON disciplinary_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    issued_by = auth.uid()
    AND action_type IN ('verejtje_goje', 'verejtje_shkrim')
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'mesues')
  );

-- Nxënësi: sheh të vetën
DROP POLICY IF EXISTS "Students read own disciplinary" ON disciplinary_actions;
CREATE POLICY "Students read own disciplinary"
  ON disciplinary_actions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Prindi: sheh të fëmijëve të vet
DROP POLICY IF EXISTS "Parents read child disciplinary" ON disciplinary_actions;
CREATE POLICY "Parents read child disciplinary"
  ON disciplinary_actions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = disciplinary_actions.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );
