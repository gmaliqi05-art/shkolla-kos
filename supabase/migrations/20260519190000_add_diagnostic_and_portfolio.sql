/*
  # Paketa 12: Vlerësimi Diagnostikues & Portofoli (UA 06/2022)

  Plotëson 3 komponentë të paplotë të vlerësimit nga UA 06/2022:
  1. Vlerësimi diagnostikues (në fillim të vitit)
  2. Portofoli i nxënësit (koleksion punimesh)
  3. Vetëvlerësimi i nxënësit
*/

-- =============================================================================
-- 1) DIAGNOSTIC_ASSESSMENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS diagnostic_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  starting_level text CHECK (starting_level IN ('shume_i_dobet', 'i_dobet', 'mesatar', 'i_mire', 'shkelqyer')),
  strengths text DEFAULT '',
  weaknesses text DEFAULT '',
  recommended_actions text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, subject_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS diag_student_idx ON diagnostic_assessments(student_id);
CREATE INDEX IF NOT EXISTS diag_class_idx ON diagnostic_assessments(class_id);

ALTER TABLE diagnostic_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and pedagog full access diag" ON diagnostic_assessments;
CREATE POLICY "Director and pedagog full access diag"
  ON diagnostic_assessments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Teachers manage own diag" ON diagnostic_assessments;
CREATE POLICY "Teachers manage own diag"
  ON diagnostic_assessments FOR ALL TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students read own diag" ON diagnostic_assessments;
CREATE POLICY "Students read own diag"
  ON diagnostic_assessments FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child diag" ON diagnostic_assessments;
CREATE POLICY "Parents read child diag"
  ON diagnostic_assessments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students WHERE parent_students.student_id = diagnostic_assessments.student_id AND parent_students.parent_id = auth.uid()));

-- =============================================================================
-- 2) STUDENT_PORTFOLIOS + PORTFOLIO_ITEMS
-- =============================================================================

CREATE TABLE IF NOT EXISTS student_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Portofoli',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS portfolio_student_idx ON student_portfolios(student_id);

ALTER TABLE student_portfolios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director full access portfolios" ON student_portfolios;
CREATE POLICY "Director full access portfolios"
  ON student_portfolios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'pedagog')));

DROP POLICY IF EXISTS "Teachers manage class portfolios" ON student_portfolios;
CREATE POLICY "Teachers manage class portfolios"
  ON student_portfolios FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = student_portfolios.student_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = student_portfolios.student_id AND c.homeroom_teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = student_portfolios.student_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = student_portfolios.student_id AND c.homeroom_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Students read own portfolio" ON student_portfolios;
CREATE POLICY "Students read own portfolio"
  ON student_portfolios FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read child portfolio" ON student_portfolios;
CREATE POLICY "Parents read child portfolio"
  ON student_portfolios FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students WHERE parent_students.student_id = student_portfolios.student_id AND parent_students.parent_id = auth.uid()));

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES student_portfolios(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  item_type text NOT NULL CHECK (item_type IN ('punim', 'projekt', 'detyre', 'foto', 'video', 'vetevleresim', 'reflektim', 'tjeter')),
  title text NOT NULL,
  description text DEFAULT '',
  content text DEFAULT '',
  attachment_url text,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  added_by_role text,
  added_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portfolio_items_portfolio_idx ON portfolio_items(portfolio_id);
CREATE INDEX IF NOT EXISTS portfolio_items_added_at_idx ON portfolio_items(added_at DESC);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read items via portfolio" ON portfolio_items;
CREATE POLICY "Read items via portfolio"
  ON portfolio_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_portfolios p
      WHERE p.id = portfolio_items.portfolio_id
        AND (
          p.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM parent_students WHERE parent_students.student_id = p.student_id AND parent_students.parent_id = auth.uid())
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','pedagog'))
          OR EXISTS (
            SELECT 1 FROM student_classes sc
            JOIN class_subjects cs ON cs.class_id = sc.class_id
            WHERE sc.student_id = p.student_id AND cs.teacher_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM student_classes sc
            JOIN classes c ON c.id = sc.class_id
            WHERE sc.student_id = p.student_id AND c.homeroom_teacher_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Add items to own/managed portfolio" ON portfolio_items;
CREATE POLICY "Add items to own/managed portfolio"
  ON portfolio_items FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM student_portfolios p
      WHERE p.id = portfolio_items.portfolio_id
        AND (
          p.student_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','pedagog'))
          OR EXISTS (
            SELECT 1 FROM student_classes sc
            JOIN class_subjects cs ON cs.class_id = sc.class_id
            WHERE sc.student_id = p.student_id AND cs.teacher_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM student_classes sc
            JOIN classes c ON c.id = sc.class_id
            WHERE sc.student_id = p.student_id AND c.homeroom_teacher_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "Delete own portfolio items" ON portfolio_items;
CREATE POLICY "Delete own portfolio items"
  ON portfolio_items FOR DELETE TO authenticated
  USING (added_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','pedagog')));

-- =============================================================================
-- 3) SELF_ASSESSMENTS (Vetëvlerësim i nxënësit)
-- =============================================================================

CREATE TABLE IF NOT EXISTS self_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  period integer CHECK (period IN (1, 2, 3)),
  level text NOT NULL CHECK (level IN ('shkelqyeshem', 'shume_mire', 'mire', 'kenaqshem', 'duhet_permiresuar')),
  what_learned text DEFAULT '',
  what_to_improve text DEFAULT '',
  goals text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (student_id, subject_id, period)
);

CREATE INDEX IF NOT EXISTS self_assess_student_idx ON self_assessments(student_id);

ALTER TABLE self_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students manage own self_assess" ON self_assessments;
CREATE POLICY "Students manage own self_assess"
  ON self_assessments FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers read class self_assess" ON self_assessments;
CREATE POLICY "Teachers read class self_assess"
  ON self_assessments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = self_assessments.student_id AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = self_assessments.student_id AND c.homeroom_teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents read child self_assess" ON self_assessments;
CREATE POLICY "Parents read child self_assess"
  ON self_assessments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students WHERE parent_students.student_id = self_assessments.student_id AND parent_students.parent_id = auth.uid()));

DROP POLICY IF EXISTS "Director read all self_assess" ON self_assessments;
CREATE POLICY "Director read all self_assess"
  ON self_assessments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor','pedagog')));
