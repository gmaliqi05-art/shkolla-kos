/*
  # Paketa 19: Hierarkia Administrative

  Krijon strukturën e administratës arsimore të Kosovës:
  - MAShTI (Ministria) — niveli kombëtar
  - DKA (Drejtoria Komunale e Arsimit) — niveli komunal
  - Shkolla — niveli ekzekutiv

  Çfarë shton:
  1. localities — fshatrat/qytetet e Kosovës
  2. Fusha të reja te profiles për DKA dhe Ministri
  3. RLS policies të zgjeruara për të dy rolet e reja
*/

-- =============================================================================
-- 1) LOCALITIES (fshatra/qytete)
-- =============================================================================

CREATE TABLE IF NOT EXISTS localities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality_id uuid NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'fshat' CHECK (type IN ('qytet','fshat','lagje','komuna')),
  is_city_center boolean DEFAULT false,
  postal_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (name, municipality_id)
);

CREATE INDEX IF NOT EXISTS localities_municipality_idx ON localities(municipality_id);
CREATE INDEX IF NOT EXISTS localities_name_idx ON localities(name);

ALTER TABLE localities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read localities" ON localities;
CREATE POLICY "All authenticated read localities"
  ON localities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Director and DKA and Ministry manage localities" ON localities;
CREATE POLICY "Director and DKA and Ministry manage localities"
  ON localities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','drejtor_komunal','ministri')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','drejtor_komunal','ministri')));

-- =============================================================================
-- 2) PROFILES - fusha të reja për DKA dhe Ministri
-- =============================================================================

-- managed_municipality_id për Drejtorin Komunal (DKA)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_municipality_id uuid REFERENCES municipalities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS profiles_managed_municipality_idx ON profiles(managed_municipality_id) WHERE managed_municipality_id IS NOT NULL;

-- managed_locality_id për shkolla në fshat
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_locality_id uuid REFERENCES localities(id) ON DELETE SET NULL;

-- =============================================================================
-- 3) SCHOOL_INFO - shto locality_id
-- =============================================================================

ALTER TABLE school_info ADD COLUMN IF NOT EXISTS locality_id uuid REFERENCES localities(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS school_info_locality_idx ON school_info(locality_id);

-- =============================================================================
-- 4) RLS - shto rolet e reja
-- =============================================================================

-- Ministri sheh gjithçka të profiles
DROP POLICY IF EXISTS "Ministri reads all profiles" ON profiles;
CREATE POLICY "Ministri reads all profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ministri'));

-- DKA sheh profile në komunën e tij
DROP POLICY IF EXISTS "DKA reads municipality profiles" ON profiles;
CREATE POLICY "DKA reads municipality profiles" ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'drejtor_komunal'
        AND (
          profiles.school_id IN (SELECT id FROM school_info WHERE municipality_id = p.managed_municipality_id)
          OR profiles.id = p.id
        )
    )
  );

-- Ministri menaxhon profile (mund të krijojë DKA për komuna)
DROP POLICY IF EXISTS "Ministri manages profiles" ON profiles;
CREATE POLICY "Ministri manages profiles" ON profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ministri'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ministri'));

-- DKA menaxhon profile në komunën e tij (krijim drejtorësh shkollash)
DROP POLICY IF EXISTS "DKA manages own municipality profiles" ON profiles;
CREATE POLICY "DKA manages own municipality profiles" ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'drejtor_komunal'
    )
  );

-- Ministri dhe DKA mund të menaxhojnë school_info
DROP POLICY IF EXISTS "Ministri manages school_info" ON school_info;
CREATE POLICY "Ministri manages school_info" ON school_info FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ministri'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'ministri'));

DROP POLICY IF EXISTS "DKA manages own municipality schools" ON school_info;
CREATE POLICY "DKA manages own municipality schools" ON school_info FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'drejtor_komunal'
        AND p.managed_municipality_id = school_info.municipality_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'drejtor_komunal'
        AND p.managed_municipality_id = school_info.municipality_id
    )
  );

-- =============================================================================
-- 5) SEED LOCALITIES për 38 komunat
-- =============================================================================

-- Helper: insert qytetin si is_city_center per cdo komune dhe disa fshatra te medhenj
DO $$
DECLARE
  m_id uuid;
BEGIN
  -- Prishtinë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Prishtinë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Prishtinë', m_id, 'qytet', true),
      ('Bardhosh', m_id, 'fshat', false),
      ('Hajvali', m_id, 'fshat', false),
      ('Llukar', m_id, 'fshat', false),
      ('Çagllavicë', m_id, 'fshat', false),
      ('Bërnicë e Epërme', m_id, 'fshat', false),
      ('Bërnicë e Poshtme', m_id, 'fshat', false),
      ('Slatinë e Madhe', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Prizren
  SELECT id INTO m_id FROM municipalities WHERE name = 'Prizren';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Prizren', m_id, 'qytet', true),
      ('Atmagjë', m_id, 'fshat', false),
      ('Hoçë e Madhe', m_id, 'fshat', false),
      ('Pllanjan', m_id, 'fshat', false),
      ('Krushë e Madhe', m_id, 'fshat', false),
      ('Velezhë', m_id, 'fshat', false),
      ('Zhur', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Pejë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Pejë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Pejë', m_id, 'qytet', true),
      ('Vitomiricë', m_id, 'fshat', false),
      ('Llapushnik', m_id, 'fshat', false),
      ('Drelaj', m_id, 'fshat', false),
      ('Loxhë', m_id, 'fshat', false),
      ('Trubuhoc', m_id, 'fshat', false),
      ('Rosht', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Mitrovicë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Mitrovicë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Mitrovicë', m_id, 'qytet', true),
      ('Frashër', m_id, 'fshat', false),
      ('Bare', m_id, 'fshat', false),
      ('Suhodoll', m_id, 'fshat', false),
      ('Zhabar', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gjakovë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Gjakovë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Gjakovë', m_id, 'qytet', true),
      ('Bishtazhin', m_id, 'fshat', false),
      ('Damjan', m_id, 'fshat', false),
      ('Doblibarë', m_id, 'fshat', false),
      ('Ponoshec', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Ferizaj
  SELECT id INTO m_id FROM municipalities WHERE name = 'Ferizaj';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Ferizaj', m_id, 'qytet', true),
      ('Pleshinë', m_id, 'fshat', false),
      ('Komogllavë', m_id, 'fshat', false),
      ('Greme', m_id, 'fshat', false),
      ('Talinoc i Muhaxherëve', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Gjilan
  SELECT id INTO m_id FROM municipalities WHERE name = 'Gjilan';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Gjilan', m_id, 'qytet', true),
      ('Velekincë', m_id, 'fshat', false),
      ('Llashticë', m_id, 'fshat', false),
      ('Stanishor', m_id, 'fshat', false),
      ('Zhegër', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Vushtrri
  SELECT id INTO m_id FROM municipalities WHERE name = 'Vushtrri';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Vushtrri', m_id, 'qytet', true),
      ('Pestovë', m_id, 'fshat', false),
      ('Stanovc i Epërm', m_id, 'fshat', false),
      ('Studime', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Podujevë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Podujevë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Podujevë', m_id, 'qytet', true),
      ('Lluzhan', m_id, 'fshat', false),
      ('Sibovc', m_id, 'fshat', false),
      ('Murgull', m_id, 'fshat', false),
      ('Sllatinë', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Suharekë
  SELECT id INTO m_id FROM municipalities WHERE name = 'Suharekë';
  IF m_id IS NOT NULL THEN
    INSERT INTO localities (name, municipality_id, type, is_city_center) VALUES
      ('Suharekë', m_id, 'qytet', true),
      ('Bllacë', m_id, 'fshat', false),
      ('Reshtan', m_id, 'fshat', false),
      ('Mushtisht', m_id, 'fshat', false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- For remaining 28 municipalities, just add the city center for now
  FOR m_id IN SELECT id FROM municipalities WHERE name NOT IN ('Prishtinë','Prizren','Pejë','Mitrovicë','Gjakovë','Ferizaj','Gjilan','Vushtrri','Podujevë','Suharekë') LOOP
    INSERT INTO localities (name, municipality_id, type, is_city_center)
    SELECT m.name, m.id, 'qytet', true FROM municipalities m WHERE m.id = m_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
