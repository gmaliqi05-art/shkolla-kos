/*
  # Paketa 13: Plani Vjetor i Shkollës

  Përputhshmëri me:
  - Ligji 04/L-032 për Arsimin Parauniversitar (detyrim i drejtorit)
  - UA për Planifikimin Vjetor Shkollor

  Çfarë shton:
  1. annual_school_plans — plani vjetor zyrtar i shkollës
  2. plan_objectives — objektivat e plani me afate
*/

CREATE TABLE IF NOT EXISTS annual_school_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  school_id uuid REFERENCES school_info(id) ON DELETE SET NULL,
  title text NOT NULL,
  vision text DEFAULT '',
  mission text DEFAULT '',
  values_principles text DEFAULT '',
  analysis_situation text DEFAULT '',
  priority_areas text DEFAULT '',
  general_goals text DEFAULT '',
  resources text DEFAULT '',
  evaluation_methods text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','miratuar','aktiv','perfunduar')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approved_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (academic_year_id, school_id)
);

CREATE INDEX IF NOT EXISTS asp_year_idx ON annual_school_plans(academic_year_id);
CREATE INDEX IF NOT EXISTS asp_status_idx ON annual_school_plans(status);

ALTER TABLE annual_school_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages plans" ON annual_school_plans;
CREATE POLICY "Director manages plans"
  ON annual_school_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "All authenticated read approved plans" ON annual_school_plans;
CREATE POLICY "All authenticated read approved plans"
  ON annual_school_plans FOR SELECT TO authenticated
  USING (status IN ('miratuar','aktiv','perfunduar'));

-- Objectives
CREATE TABLE IF NOT EXISTS plan_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES annual_school_plans(id) ON DELETE CASCADE,
  area text NOT NULL CHECK (area IN ('mesimore','organizative','infrastrukture','profesionale','sociale','tjeter')),
  title text NOT NULL,
  description text DEFAULT '',
  expected_outcome text DEFAULT '',
  responsible_person text DEFAULT '',
  start_date date,
  target_date date,
  status text NOT NULL DEFAULT 'planifikuar' CHECK (status IN ('planifikuar','ne_proces','arritur','pjeserisht_arritur','nuk_eshte_arritur')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_obj_plan_idx ON plan_objectives(plan_id);

ALTER TABLE plan_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages objectives" ON plan_objectives;
CREATE POLICY "Director manages objectives"
  ON plan_objectives FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "All read objectives via plan" ON plan_objectives;
CREATE POLICY "All read objectives via plan"
  ON plan_objectives FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM annual_school_plans p
      WHERE p.id = plan_objectives.plan_id
        AND p.status IN ('miratuar','aktiv','perfunduar')
    )
  );
