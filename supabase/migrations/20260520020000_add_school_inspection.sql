/*
  # Paketa 23: Inspektimi Shkollor (Ligji 06/L-046)

  Përputhshmëri me Ligjin Nr. 06/L-046 për Inspektoratin e Arsimit.
  Krijon strukturën e plotë për inspektim shkollor.

  Çfarë shton:
  1. inspections — vizitat e inspektimit
  2. inspection_findings — gjetjet e inspektorit (çështje të identifikuara)
  3. inspection_recommendations — rekomandimet me afate dhe statuse
*/

CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES school_info(id) ON DELETE CASCADE,
  inspector_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  inspection_type text NOT NULL CHECK (inspection_type IN ('e_rregullt','e_jashtezakonshme','tematike','ndjekje','ankese')),
  planned_date date NOT NULL,
  conducted_date date,
  duration_hours numeric(4,1),
  status text NOT NULL DEFAULT 'planifikuar' CHECK (status IN ('planifikuar','ne_proces','perfunduar','anuluar')),
  scope text DEFAULT '',
  overall_rating text CHECK (overall_rating IS NULL OR overall_rating IN ('shkelqyer','i_mire','i_kenaqshem','duhet_permiresuar','i_papranueshem')),
  summary text DEFAULT '',
  approved_by_director boolean DEFAULT false,
  approved_at timestamptz,
  director_comments text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspections_school_idx ON inspections(school_id);
CREATE INDEX IF NOT EXISTS inspections_inspector_idx ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS inspections_status_idx ON inspections(status);
CREATE INDEX IF NOT EXISTS inspections_date_idx ON inspections(planned_date DESC);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inspector manages own inspections" ON inspections;
CREATE POLICY "Inspector manages own inspections" ON inspections FOR ALL TO authenticated
  USING (inspector_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ministri','drejtor_komunal')))
  WITH CHECK (inspector_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('ministri','drejtor_komunal')));

DROP POLICY IF EXISTS "Director reads school inspections" ON inspections;
CREATE POLICY "Director reads school inspections" ON inspections FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = inspections.school_id));

DROP POLICY IF EXISTS "Director acknowledges inspections" ON inspections;
CREATE POLICY "Director acknowledges inspections" ON inspections FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = inspections.school_id))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = inspections.school_id));

CREATE TABLE IF NOT EXISTS inspection_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('infrastrukture','dokumentacion','mesimdhenie','siguri','administrim','sjellje','tjeter')),
  severity text NOT NULL CHECK (severity IN ('e_lehte','mesatare','e_rende','kritike')),
  title text NOT NULL,
  description text NOT NULL,
  evidence text DEFAULT '',
  legal_basis text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS findings_inspection_idx ON inspection_findings(inspection_id);

ALTER TABLE inspection_findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read findings via inspection access" ON inspection_findings;
CREATE POLICY "Read findings via inspection access" ON inspection_findings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND (i.inspector_id = auth.uid()
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ministri','drejtor_komunal'))
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = i.school_id))
    )
  );

DROP POLICY IF EXISTS "Inspector manages findings" ON inspection_findings;
CREATE POLICY "Inspector manages findings" ON inspection_findings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_findings.inspection_id AND i.inspector_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM inspections i WHERE i.id = inspection_findings.inspection_id AND i.inspector_id = auth.uid()));

CREATE TABLE IF NOT EXISTS inspection_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES inspection_findings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('ulet','mesatar','larte','urgjent')),
  deadline date,
  responsible text DEFAULT 'drejtori_shkolles',
  status text NOT NULL DEFAULT 'i_papermbushur' CHECK (status IN ('i_papermbushur','ne_proces','i_permbushur','jo_aplikuar')),
  completion_evidence text DEFAULT '',
  completed_at timestamptz,
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendations_inspection_idx ON inspection_recommendations(inspection_id);
CREATE INDEX IF NOT EXISTS recommendations_status_idx ON inspection_recommendations(status);

ALTER TABLE inspection_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read recommendations via inspection" ON inspection_recommendations;
CREATE POLICY "Read recommendations via inspection" ON inspection_recommendations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_recommendations.inspection_id
        AND (i.inspector_id = auth.uid()
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('ministri','drejtor_komunal'))
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = i.school_id))
    )
  );

DROP POLICY IF EXISTS "Inspector and director manage recommendations" ON inspection_recommendations;
CREATE POLICY "Inspector and director manage recommendations" ON inspection_recommendations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_recommendations.inspection_id
        AND (i.inspector_id = auth.uid()
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = i.school_id))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections i
      WHERE i.id = inspection_recommendations.inspection_id
        AND (i.inspector_id = auth.uid()
             OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor' AND p.school_id = i.school_id))
    )
  );
