/*
  # Raportimi i incidenteve / dhunës / bullizmit (UA 13/2018)

  Detyrim ligjor: shkolla dokumenton çdo incident dhune/bullizmi/ngacmimi,
  njofton drejtorin, njofton prindin, dhe raporton policinë kur është rast.
  Konfidencialiteti i viktimës/dëshmitarëve ruhet.

  RLS:
  - Mësues/drejtor/pedagog raportojnë për shkollën e vet (INSERT).
  - Drejtori & pedagogu i shkollës menaxhojnë (FOR ALL).
  - Raportuesi lexon raportet e veta.
  Prindi/nxënësi NUK kanë qasje (konfidencialitet) — njoftimi bëhet jashtë bandës.
*/

CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES school_info(id) ON DELETE CASCADE,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_type text NOT NULL CHECK (incident_type IN (
    'bullizem', 'dhune_fizike', 'dhune_verbale', 'ngacmim', 'ngacmim_seksual',
    'vjedhje', 'demtim_prone', 'substanca', 'kercenim', 'tjeter'
  )),
  severity text NOT NULL DEFAULT 'mesatare' CHECK (severity IN ('lehte', 'mesatare', 'rende')),
  location text DEFAULT '',
  description text NOT NULL,
  involved_students uuid[] DEFAULT '{}',
  witnesses text DEFAULT '',
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'i_hapur' CHECK (status IN ('i_hapur', 'ne_proces', 'mbyllur')),
  director_actions text DEFAULT '',
  parent_notified_at timestamptz,
  police_notified boolean DEFAULT false,
  police_report_number text DEFAULT '',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incident_reports_school_idx ON incident_reports(school_id);
CREATE INDEX IF NOT EXISTS incident_reports_date_idx ON incident_reports(incident_date DESC);

-- Plotëso school_id nga raportuesi kur mungon
DROP TRIGGER IF EXISTS trg_incident_reports_set_school ON incident_reports;
CREATE TRIGGER trg_incident_reports_set_school
  BEFORE INSERT ON incident_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_creator();

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Stafi raporton për shkollën e vet
DROP POLICY IF EXISTS "Staff report incidents" ON incident_reports;
CREATE POLICY "Staff report incidents" ON incident_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND public.current_user_role() IN ('mesues', 'drejtor', 'pedagog')
  );

-- Drejtori & pedagogu i shkollës menaxhojnë gjithçka
DROP POLICY IF EXISTS "School staff manage incidents" ON incident_reports;
CREATE POLICY "School staff manage incidents" ON incident_reports
  FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('drejtor', 'pedagog')
    AND school_id = public.current_user_school_id()
  )
  WITH CHECK (
    public.current_user_role() IN ('drejtor', 'pedagog')
    AND school_id = public.current_user_school_id()
  );

-- Raportuesi lexon raportet e veta
DROP POLICY IF EXISTS "Reporter reads own incidents" ON incident_reports;
CREATE POLICY "Reporter reads own incidents" ON incident_reports
  FOR SELECT TO authenticated
  USING (reported_by = auth.uid());
