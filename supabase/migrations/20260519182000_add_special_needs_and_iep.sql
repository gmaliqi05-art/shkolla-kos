/*
  # Paketa 3: NVA & PIA — Arsimi Gjithëpërfshirës

  Përputhshmëri me:
  - Ligji Nr. 04/L-032 për Arsimin Parauniversitar, Neni 40 (Arsimi i nxënësve
    me nevoja të veçanta arsimore)
  - UA Nr. 23/2013 për kategorizimin e nxënësve me NVA
  - UA Nr. 28/2012 për inkluzionin e fëmijëve me NVA
  - Konventa e OKB-së për të Drejtat e Personave me Aftësi të Kufizuara
    (ratifikuar nga Kosova)

  Çfarë shton:
  1. special_needs — kategorizimi i nxënësve me Nevoja të Veçanta Arsimore
  2. individual_education_plans (PIA) — Plani Individual i Arsimimit
  3. iep_goals — objektivat e PIA-së
  4. iep_accommodations — akomodimet e arsyeshme
  5. support_staff_assignments — pedagog/psikolog/asistent/logoped

  Roli i ri 'pedagog' (i 5-të) — për pedagog/psikolog/logoped shkollor.
  Nuk shtohet constraint enum pasi `role` është text (më fleksibël).
*/

-- =============================================================================
-- 1) SPECIAL_NEEDS — kategorizimi i NVA
-- =============================================================================

CREATE TABLE IF NOT EXISTS special_needs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'gjuhesore',
    'fizike',
    'shqisore',
    'intelektuale',
    'sjellore',
    'emocionale',
    'specifike_te_nxenit',
    'autizem',
    'shumefishte',
    'tjeter'
  )),
  severity text CHECK (severity IS NULL OR severity IN ('lehte', 'mesatare', 'rende', 'shume_rende')),
  diagnosis text DEFAULT '',
  diagnosed_at date,
  diagnosed_by text DEFAULT '',
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, category)
);

CREATE INDEX IF NOT EXISTS special_needs_student_idx ON special_needs(student_id) WHERE is_active = true;

ALTER TABLE special_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and pedagog full access on special_needs" ON special_needs;
CREATE POLICY "Director and pedagog full access on special_needs"
  ON special_needs FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Teachers read student special_needs" ON special_needs;
CREATE POLICY "Teachers read student special_needs"
  ON special_needs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = special_needs.student_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = special_needs.student_id AND c.homeroom_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents read child special_needs" ON special_needs;
CREATE POLICY "Parents read child special_needs"
  ON special_needs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = special_needs.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own special_needs" ON special_needs;
CREATE POLICY "Students read own special_needs"
  ON special_needs FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- =============================================================================
-- 2) INDIVIDUAL_EDUCATION_PLANS (PIA — Plani Individual i Arsimimit)
-- =============================================================================

CREATE TABLE IF NOT EXISTS individual_education_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'aktiv', 'pezulluar', 'perfunduar')),
  coordinator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  parent_consent boolean DEFAULT false,
  parent_consent_at timestamptz,
  parent_consent_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iep_student_idx ON individual_education_plans(student_id);
CREATE INDEX IF NOT EXISTS iep_status_idx ON individual_education_plans(status);

ALTER TABLE individual_education_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and pedagog full access on iep" ON individual_education_plans;
CREATE POLICY "Director and pedagog full access on iep"
  ON individual_education_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Teachers read IEP for own students" ON individual_education_plans;
CREATE POLICY "Teachers read IEP for own students"
  ON individual_education_plans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = individual_education_plans.student_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = individual_education_plans.student_id AND c.homeroom_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents read & consent child IEP" ON individual_education_plans;
CREATE POLICY "Parents read & consent child IEP"
  ON individual_education_plans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = individual_education_plans.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

-- Prindi mund të përditësojë vetëm pëlqimin e tij — kontrolli te kolonat bëhet në UI
DROP POLICY IF EXISTS "Parents update consent on child IEP" ON individual_education_plans;
CREATE POLICY "Parents update consent on child IEP"
  ON individual_education_plans FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = individual_education_plans.student_id
        AND parent_students.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = individual_education_plans.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

-- =============================================================================
-- 3) IEP_GOALS — objektivat e PIA
-- =============================================================================

CREATE TABLE IF NOT EXISTS iep_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iep_id uuid NOT NULL REFERENCES individual_education_plans(id) ON DELETE CASCADE,
  goal_area text NOT NULL CHECK (goal_area IN (
    'akademik',
    'gjuhesor',
    'sjellor',
    'social',
    'emocional',
    'motorik',
    'pavaresi',
    'tjeter'
  )),
  description text NOT NULL,
  target_date date,
  achievement_criteria text DEFAULT '',
  status text NOT NULL DEFAULT 'ne_proces' CHECK (status IN ('ne_proces', 'arritur', 'pjeserisht_arritur', 'nuk_eshte_arritur', 'shtyer')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iep_goals_iep_idx ON iep_goals(iep_id);

ALTER TABLE iep_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and pedagog full access on iep_goals" ON iep_goals;
CREATE POLICY "Director and pedagog full access on iep_goals"
  ON iep_goals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Read iep_goals via parent IEP" ON iep_goals;
CREATE POLICY "Read iep_goals via parent IEP"
  ON iep_goals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM individual_education_plans iep
      JOIN parent_students ps ON ps.student_id = iep.student_id
      WHERE iep.id = iep_goals.iep_id AND ps.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Read iep_goals via teacher class" ON iep_goals;
CREATE POLICY "Read iep_goals via teacher class"
  ON iep_goals FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM individual_education_plans iep
      JOIN student_classes sc ON sc.student_id = iep.student_id
      LEFT JOIN class_subjects cs ON cs.class_id = sc.class_id
      LEFT JOIN classes c ON c.id = sc.class_id
      WHERE iep.id = iep_goals.iep_id
        AND (cs.teacher_id = auth.uid() OR c.homeroom_teacher_id = auth.uid())
    )
  );

-- =============================================================================
-- 4) IEP_ACCOMMODATIONS — akomodimet e arsyeshme
-- =============================================================================

CREATE TABLE IF NOT EXISTS iep_accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iep_id uuid NOT NULL REFERENCES individual_education_plans(id) ON DELETE CASCADE,
  accommodation_type text NOT NULL CHECK (accommodation_type IN (
    'kohe_shtese_provim',
    'mjedis_qete',
    'mjete_ndihmese',
    'asistent_personal',
    'materiale_te_pershtatura',
    'vlerasim_alternativ',
    'pushim_shtese',
    'ulja_e_pershtatur',
    'teknollogji_ndihmese',
    'gjuha_shenjave',
    'libra_shkronja_te_medha',
    'tjeter'
  )),
  description text NOT NULL,
  applies_to_subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS iep_accommodations_iep_idx ON iep_accommodations(iep_id);

ALTER TABLE iep_accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and pedagog full access on iep_accommodations" ON iep_accommodations;
CREATE POLICY "Director and pedagog full access on iep_accommodations"
  ON iep_accommodations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Read accommodations via parent" ON iep_accommodations;
CREATE POLICY "Read accommodations via parent"
  ON iep_accommodations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM individual_education_plans iep
      JOIN parent_students ps ON ps.student_id = iep.student_id
      WHERE iep.id = iep_accommodations.iep_id AND ps.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Read accommodations via teacher class" ON iep_accommodations;
CREATE POLICY "Read accommodations via teacher class"
  ON iep_accommodations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM individual_education_plans iep
      JOIN student_classes sc ON sc.student_id = iep.student_id
      LEFT JOIN class_subjects cs ON cs.class_id = sc.class_id
      LEFT JOIN classes c ON c.id = sc.class_id
      WHERE iep.id = iep_accommodations.iep_id
        AND (cs.teacher_id = auth.uid() OR c.homeroom_teacher_id = auth.uid())
    )
  );

-- =============================================================================
-- 5) SUPPORT_STAFF_ASSIGNMENTS — pedagog/psikolog/asistent/logoped
-- =============================================================================

CREATE TABLE IF NOT EXISTS support_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  support_staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('asistent', 'pedagog', 'psikolog', 'logoped', 'mesues_mbeshtetes', 'tjeter')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  hours_per_week numeric(5,2),
  notes text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, support_staff_id, role, start_date)
);

CREATE INDEX IF NOT EXISTS support_assignments_student_idx ON support_staff_assignments(student_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS support_assignments_staff_idx ON support_staff_assignments(support_staff_id) WHERE is_active = true;

ALTER TABLE support_staff_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages support_staff_assignments" ON support_staff_assignments;
CREATE POLICY "Director manages support_staff_assignments"
  ON support_staff_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Support staff read own assignments" ON support_staff_assignments;
CREATE POLICY "Support staff read own assignments"
  ON support_staff_assignments FOR SELECT TO authenticated
  USING (support_staff_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child support" ON support_staff_assignments;
CREATE POLICY "Parents read child support"
  ON support_staff_assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = support_staff_assignments.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own support" ON support_staff_assignments;
CREATE POLICY "Students read own support"
  ON support_staff_assignments FOR SELECT TO authenticated
  USING (student_id = auth.uid());
