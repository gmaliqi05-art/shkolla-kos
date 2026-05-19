/*
  # Paketa 10: Multi-shkollë & Komuna (Ligji 03/L-068)

  Përputhshmëri me:
  - Ligji 03/L-068 për Arsimin në Komunat e Republikës së Kosovës
  - MAShTI — organizimi territorial i arsimit

  Çfarë shton:
  1. municipalities — 38 komunat e Kosovës (të mbillura)
  2. schools — tabela e shkollave (zëvendëson school_info si e vetme)
  3. Lidhje fakultative në tabelat ekzistuese për mbështetje multi-shkollë
*/

-- =============================================================================
-- 1) MUNICIPALITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  region text DEFAULT '',
  code text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read municipalities" ON municipalities;
CREATE POLICY "All authenticated read municipalities"
  ON municipalities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Director manages municipalities" ON municipalities;
CREATE POLICY "Director manages municipalities"
  ON municipalities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Mbjell 38 komunat e Kosovës
INSERT INTO municipalities (name, region) VALUES
  ('Prishtinë', 'Qendër'),
  ('Prizren', 'Jug'),
  ('Pejë', 'Perëndim'),
  ('Mitrovicë', 'Veri'),
  ('Gjakovë', 'Perëndim'),
  ('Ferizaj', 'Lindje'),
  ('Gjilan', 'Lindje'),
  ('Vushtrri', 'Veri'),
  ('Podujevë', 'Qendër'),
  ('Suharekë', 'Jug'),
  ('Rahovec', 'Jug'),
  ('Lipjan', 'Qendër'),
  ('Skenderaj', 'Veri'),
  ('Malishevë', 'Jug'),
  ('Drenas', 'Qendër'),
  ('Kamenicë', 'Lindje'),
  ('Viti', 'Lindje'),
  ('Deçan', 'Perëndim'),
  ('Istog', 'Perëndim'),
  ('Klinë', 'Perëndim'),
  ('Kaçanik', 'Lindje'),
  ('Shtime', 'Qendër'),
  ('Fushë Kosovë', 'Qendër'),
  ('Obiliq', 'Qendër'),
  ('Dragash', 'Jug'),
  ('Shtërpcë', 'Jug'),
  ('Hani i Elezit', 'Lindje'),
  ('Junik', 'Perëndim'),
  ('Mamushë', 'Jug'),
  ('Graçanicë', 'Qendër'),
  ('Ranillug', 'Lindje'),
  ('Partesh', 'Lindje'),
  ('Kllokot', 'Lindje'),
  ('Zveçan', 'Veri'),
  ('Zubin Potok', 'Veri'),
  ('Leposaviq', 'Veri'),
  ('Mitrovicë e Veriut', 'Veri'),
  ('Novobërdë', 'Qendër')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 2) SCHOOLS (zgjerim i school_info ekzistuese)
-- =============================================================================

-- Shto fushën municipality_id te school_info
ALTER TABLE school_info
  ADD COLUMN IF NOT EXISTS municipality_id uuid REFERENCES municipalities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_type text DEFAULT 'fillore_mesme_ulet' CHECK (school_type IN ('parashkollor', 'fillore', 'fillore_mesme_ulet', 'mesme_ulet', 'mesme_larte', 'profesionale', 'speciale', 'private'));

-- Lidh school_info ekzistuese (nëse ka) me një komunë default (Prishtinë) nëse municipality është një string
UPDATE school_info
SET municipality_id = (SELECT id FROM municipalities WHERE name = NULLIF(municipality, '') LIMIT 1)
WHERE municipality_id IS NULL AND municipality <> '';

-- =============================================================================
-- 3) MULTI-SCHOOL SUPPORT (additive, nullable)
-- =============================================================================

-- Shto school_id (opsionale) te tabelat kryesore për mbështetje në të ardhmen
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school_info(id) ON DELETE SET NULL;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school_info(id) ON DELETE SET NULL;
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school_info(id) ON DELETE SET NULL;

-- Backfill: lidh të dhënat ekzistuese me shkollën default (e para në school_info)
UPDATE profiles SET school_id = (SELECT id FROM school_info ORDER BY created_at LIMIT 1) WHERE school_id IS NULL;
UPDATE classes SET school_id = (SELECT id FROM school_info ORDER BY created_at LIMIT 1) WHERE school_id IS NULL;
UPDATE academic_years SET school_id = (SELECT id FROM school_info ORDER BY created_at LIMIT 1) WHERE school_id IS NULL;

CREATE INDEX IF NOT EXISTS profiles_school_id_idx ON profiles(school_id);
CREATE INDEX IF NOT EXISTS classes_school_id_idx ON classes(school_id);
