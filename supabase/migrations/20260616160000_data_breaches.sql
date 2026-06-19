/*
  # Regjistri i Shkeljeve të të Dhënave (Ligji 06/L-082, Neni 7)

  Detyrim: kontrolluesi i të dhënave duhet të dokumentojë çdo shkelje sigurie
  dhe ta njoftojë Agjencinë për Informim dhe Privatësi (AIP) brenda afatit.

  RLS:
  - Drejtori menaxhon shkeljet e shkollës së vet.
  - super_admin menaxhon të gjitha; ministri lexon të gjitha (mbikëqyrje).
  school_id plotësohet automatikisht nga raportuesi.
*/

CREATE TABLE IF NOT EXISTS data_breaches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES school_info(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  affected_data_types text[] DEFAULT '{}',
  num_subjects_affected integer,
  severity text NOT NULL DEFAULT 'mesatare' CHECK (severity IN ('lehte', 'mesatare', 'rende')),
  discovered_at date NOT NULL DEFAULT CURRENT_DATE,
  reported_to_aip boolean DEFAULT false,
  aip_reported_at date,
  aip_case_number text DEFAULT '',
  mitigation text DEFAULT '',
  status text NOT NULL DEFAULT 'ne_vleresim' CHECK (status IN ('ne_vleresim', 'raportuar', 'zgjidhur')),
  reported_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS data_breaches_school_idx ON data_breaches(school_id);

DROP TRIGGER IF EXISTS trg_data_breaches_set_school ON data_breaches;
CREATE TRIGGER trg_data_breaches_set_school
  BEFORE INSERT ON data_breaches
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_creator();

ALTER TABLE data_breaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages own breaches" ON data_breaches;
CREATE POLICY "Director manages own breaches" ON data_breaches
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id())
  WITH CHECK (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id());

DROP POLICY IF EXISTS "Super admin manages all breaches" ON data_breaches;
CREATE POLICY "Super admin manages all breaches" ON data_breaches
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Ministri reads breaches" ON data_breaches;
CREATE POLICY "Ministri reads breaches" ON data_breaches
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'ministri');
