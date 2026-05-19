/*
  # Paketa 6: Licencimi i Mësimdhënësve (UA 05/2017)

  Përputhshmëri me:
  - UA Nr. 05/2017 për Licencimin e Mësimdhënësve
  - Ligji Nr. 04/L-032, Neni 30 — Kualifikimi i mësimdhënësve

  Çfarë shton:
  1. Fusha të reja te `profiles` për mësimdhënësit
  2. Tabela `professional_development` — orët e ZHPM
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_level text CHECK (license_level IS NULL OR license_level IN ('fillestar', 'karriere', 'keshillues')),
  ADD COLUMN IF NOT EXISTS license_issued_at date,
  ADD COLUMN IF NOT EXISTS license_expires_at date,
  ADD COLUMN IF NOT EXISTS qualification text DEFAULT '',
  ADD COLUMN IF NOT EXISTS subject_specialization text DEFAULT '',
  ADD COLUMN IF NOT EXISTS hired_at date;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_license_number_unique_idx
  ON profiles (license_number) WHERE license_number IS NOT NULL;

-- =============================================================================
-- PROFESSIONAL_DEVELOPMENT (ZHPM)
-- =============================================================================

CREATE TABLE IF NOT EXISTS professional_development (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  organizer text DEFAULT '',
  hours numeric(5,2) NOT NULL CHECK (hours > 0),
  completion_date date NOT NULL,
  certificate_url text,
  category text NOT NULL DEFAULT 'tjeter' CHECK (category IN (
    'didaktike_pedagogjike',
    'lendore',
    'tik',
    'gjuhe_te_huaj',
    'gjitheperfshirje',
    'menaxhim',
    'tjeter'
  )),
  notes text DEFAULT '',
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS prof_dev_teacher_idx ON professional_development(teacher_id);
CREATE INDEX IF NOT EXISTS prof_dev_date_idx ON professional_development(completion_date DESC);

ALTER TABLE professional_development ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages all prof_dev" ON professional_development;
CREATE POLICY "Director manages all prof_dev"
  ON professional_development FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Teachers read own prof_dev" ON professional_development;
CREATE POLICY "Teachers read own prof_dev"
  ON professional_development FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers insert own prof_dev" ON professional_development;
CREATE POLICY "Teachers insert own prof_dev"
  ON professional_development FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'mesues')
  );

DROP POLICY IF EXISTS "Teachers update own unverified prof_dev" ON professional_development;
CREATE POLICY "Teachers update own unverified prof_dev"
  ON professional_development FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid() AND verified = false)
  WITH CHECK (teacher_id = auth.uid() AND verified = false);
