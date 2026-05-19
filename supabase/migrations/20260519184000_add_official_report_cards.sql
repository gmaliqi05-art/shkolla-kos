/*
  # Paketa 5: Dëftesa Zyrtare & Cilësimet e Shkollës

  Përputhshmëri me:
  - UA Nr. 19/2018 për Dokumentacionin Pedagogjik — formati zyrtar i dëftesës
  - UA Nr. 06/2022 për Vlerësimin e Nxënësve — përmbajtja e dëftesës
  - Ligji 04/L-032 për Arsimin Parauniversitar — detyrimi për lëshim dëftesash

  Çfarë shton:
  1. school_info — të dhënat zyrtare të shkollës (emri, adresa, drejtori, vula)
  2. report_cards_issued — gjurmim i dëftesave të lëshuara (audit + riprintim)
*/

-- =============================================================================
-- 1) SCHOOL_INFO — të dhënat zyrtare të shkollës
-- =============================================================================

CREATE TABLE IF NOT EXISTS school_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Shkolla',
  full_name text DEFAULT '',
  address text DEFAULT '',
  municipality text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  website text DEFAULT '',
  director_name text DEFAULT '',
  logo_url text,
  stamp_url text,
  registration_number text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE school_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read school_info" ON school_info;
CREATE POLICY "All authenticated read school_info"
  ON school_info FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Director manages school_info" ON school_info;
CREATE POLICY "Director manages school_info"
  ON school_info FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Insert singleton row nëse nuk ekziston
INSERT INTO school_info (name, full_name)
SELECT 'Shkolla Kos', 'Shkolla Fillore dhe e Mesme e Ulët'
WHERE NOT EXISTS (SELECT 1 FROM school_info);

-- =============================================================================
-- 2) REPORT_CARDS_ISSUED — gjurmim i dëftesave të lëshuara
-- =============================================================================

CREATE TABLE IF NOT EXISTS report_cards_issued (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  period integer CHECK (period IS NULL OR period IN (1, 2, 3)),
  card_type text NOT NULL CHECK (card_type IN ('periudhshme', 'vjetore', 'certifikate_klases_5', 'diplome_klases_9')),
  issued_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  issued_at timestamptz DEFAULT now(),
  serial_number text,
  notes text DEFAULT '',
  UNIQUE (student_id, academic_year_id, period, card_type)
);

CREATE INDEX IF NOT EXISTS report_cards_student_idx ON report_cards_issued(student_id);
CREATE INDEX IF NOT EXISTS report_cards_class_idx ON report_cards_issued(class_id);

ALTER TABLE report_cards_issued ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages report_cards" ON report_cards_issued;
CREATE POLICY "Director manages report_cards"
  ON report_cards_issued FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Students read own report_cards" ON report_cards_issued;
CREATE POLICY "Students read own report_cards"
  ON report_cards_issued FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child report_cards" ON report_cards_issued;
CREATE POLICY "Parents read child report_cards"
  ON report_cards_issued FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = report_cards_issued.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );
