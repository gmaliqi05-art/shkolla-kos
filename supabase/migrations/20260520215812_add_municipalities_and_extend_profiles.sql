/*
  # Krijimi i tabeles se komunave dhe zgjerimi i profiles

  1. Tabela e Re
    - `municipalities` - Te gjitha 38 komunat e Kosoves me rajonet perkatese
      - `id` (uuid, primary key)
      - `name` (text) - Emri i komunes
      - `region` (text) - Rajoni (Prishtine, Mitrovice, Peje, Prizren, Ferizaj, Gjilan, Gjakove)
      - `code` (text) - Kodi i komunes
      - `created_at` (timestamptz)

  2. Kolona te Reja ne `profiles`
    - `deleted_at` (timestamptz) - Per soft-delete
    - `must_change_password` (boolean) - Perdoruesi duhet te ndryshoje fjalekalimin
    - `managed_municipality_id` (uuid FK) - Komuna qe menaxhon (per DKA)
    - `managed_locality_id` (uuid) - Lokaliteti qe menaxhon
    - `school_id` (uuid) - Shkolla e lidhur
    - `personal_number` (text) - Numri personal
    - `date_of_birth` (date) - Datelindja
    - `gender` (text) - Gjinia
    - `address` (text) - Adresa
    - `nationality` (text) - Kombesia
    - `preferred_language` (text) - Gjuha e preferuar
    - `last_login_at` (timestamptz) - Hyrja e fundit

  3. Siguria
    - RLS aktiv per municipalities
    - Politika per lexim publik te komunave (tabele reference)

  4. Te dhena fillestare
    - Te gjitha 38 komunat e Kosoves me rajonet
*/

-- Krijohet tabela e komunave
CREATE TABLE IF NOT EXISTS municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  region text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;

-- Komunat jane tabele reference -- mund te lexohen nga te gjithe perdoruesit e autentikuar
CREATE POLICY "Authenticated users can read municipalities"
  ON municipalities FOR SELECT
  TO authenticated
  USING (true);

-- Zgjerimi i tabeles profiles me kolonat qe mungojne
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
    ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'must_change_password') THEN
    ALTER TABLE profiles ADD COLUMN must_change_password boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'managed_municipality_id') THEN
    ALTER TABLE profiles ADD COLUMN managed_municipality_id uuid REFERENCES municipalities(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'managed_locality_id') THEN
    ALTER TABLE profiles ADD COLUMN managed_locality_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'school_id') THEN
    ALTER TABLE profiles ADD COLUMN school_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personal_number') THEN
    ALTER TABLE profiles ADD COLUMN personal_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'nationality') THEN
    ALTER TABLE profiles ADD COLUMN nationality text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'sq';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_login_at') THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'place_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN place_of_birth text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mother_tongue') THEN
    ALTER TABLE profiles ADD COLUMN mother_tongue text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'legal_guardian_name') THEN
    ALTER TABLE profiles ADD COLUMN legal_guardian_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'legal_guardian_relation') THEN
    ALTER TABLE profiles ADD COLUMN legal_guardian_relation text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name') THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone') THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_phone text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'emergency_contact_relation') THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_relation text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'medical_conditions') THEN
    ALTER TABLE profiles ADD COLUMN medical_conditions text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'family_doctor') THEN
    ALTER TABLE profiles ADD COLUMN family_doctor text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'enrollment_status') THEN
    ALTER TABLE profiles ADD COLUMN enrollment_status text DEFAULT 'regjistruar';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consent_recorded_at') THEN
    ALTER TABLE profiles ADD COLUMN consent_recorded_at timestamptz;
  END IF;
END $$;

-- Perditesojme check constraint per role qe te lejoje rolet e reja
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (
  role = ANY (ARRAY[
    'drejtor'::text, 'mesues'::text, 'nxenes'::text, 'prind'::text,
    'pedagog'::text, 'drejtor_komunal'::text, 'ministri'::text, 'inspektor'::text
  ])
);

-- Vendosim te gjitha 38 komunat e Kosoves
INSERT INTO municipalities (name, region, code) VALUES
  -- Rajoni i Prishtines
  ('Prishtinë', 'Prishtinë', 'PR'),
  ('Fushë Kosovë', 'Prishtinë', 'FK'),
  ('Obiliq', 'Prishtinë', 'OB'),
  ('Lipjan', 'Prishtinë', 'LP'),
  ('Podujevë', 'Prishtinë', 'PD'),
  ('Drenas', 'Prishtinë', 'DR'),
  ('Graçanicë', 'Prishtinë', 'GR'),
  -- Rajoni i Mitrovices
  ('Mitrovicë', 'Mitrovicë', 'MI'),
  ('Vushtrri', 'Mitrovicë', 'VU'),
  ('Skenderaj', 'Mitrovicë', 'SK'),
  ('Leposaviq', 'Mitrovicë', 'LE'),
  ('Zubin Potok', 'Mitrovicë', 'ZP'),
  ('Zveçan', 'Mitrovicë', 'ZV'),
  -- Rajoni i Pejes
  ('Pejë', 'Pejë', 'PE'),
  ('Deçan', 'Pejë', 'DE'),
  ('Istog', 'Pejë', 'IS'),
  ('Klinë', 'Pejë', 'KL'),
  -- Rajoni i Prizrenit
  ('Prizren', 'Prizren', 'PZ'),
  ('Suharekë', 'Prizren', 'SU'),
  ('Dragash', 'Prizren', 'DG'),
  ('Mamushë', 'Prizren', 'MA'),
  ('Rahovec', 'Prizren', 'RA'),
  ('Malishevë', 'Prizren', 'ML'),
  -- Rajoni i Ferizajt
  ('Ferizaj', 'Ferizaj', 'FE'),
  ('Kaçanik', 'Ferizaj', 'KA'),
  ('Shtime', 'Ferizaj', 'SH'),
  ('Shtërpcë', 'Ferizaj', 'ST'),
  ('Hani i Elezit', 'Ferizaj', 'HE'),
  -- Rajoni i Gjilanit
  ('Gjilan', 'Gjilan', 'GJ'),
  ('Viti', 'Gjilan', 'VI'),
  ('Kamenicë', 'Gjilan', 'KM'),
  ('Novobërdë', 'Gjilan', 'NB'),
  ('Ranillug', 'Gjilan', 'RN'),
  ('Kllokot', 'Gjilan', 'KK'),
  ('Partesh', 'Gjilan', 'PT'),
  -- Rajoni i Gjakoves
  ('Gjakovë', 'Gjakovë', 'GK'),
  ('Junik', 'Gjakovë', 'JU'),
  ('Viti', 'Gjakovë', 'VT')
ON CONFLICT DO NOTHING;
