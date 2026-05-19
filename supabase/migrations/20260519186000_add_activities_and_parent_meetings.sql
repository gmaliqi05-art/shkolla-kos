/*
  # Paketa 7: Aktivitetet Jashtëmësimore & Takimet me Prindër

  Përputhshmëri me:
  - KKK (Korniza Kurrikulare e Kosovës) — komponenti i aktiviteteve jashtëmësimore
  - UA për Komunikimin me Prindër — takimet periodike

  Çfarë shton:
  1. extracurricular_activities — klube, sport, art, etj.
  2. activity_participants — anëtarësia e nxënësve në aktivitete
  3. parent_meetings — takimet me prindër (klasore, individuale, të përgjithshme)
*/

-- =============================================================================
-- 1) EXTRACURRICULAR_ACTIVITIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS extracurricular_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('sport','art','shkence','muzike','gjuhe','teknologji','kulturore','sociale','mjedis','olimpiada','tjeter')),
  coordinator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  schedule text DEFAULT '',
  location text DEFAULT '',
  max_participants integer,
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_active_idx ON extracurricular_activities(is_active) WHERE is_active = true;

ALTER TABLE extracurricular_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and teachers manage activities" ON extracurricular_activities;
CREATE POLICY "Director and teachers manage activities"
  ON extracurricular_activities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')));

DROP POLICY IF EXISTS "All authenticated read activities" ON extracurricular_activities;
CREATE POLICY "All authenticated read activities"
  ON extracurricular_activities FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- 2) ACTIVITY_PARTICIPANTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES extracurricular_activities(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  left_at date,
  parent_consent boolean DEFAULT false,
  parent_consent_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (activity_id, student_id)
);

CREATE INDEX IF NOT EXISTS act_participants_activity_idx ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS act_participants_student_idx ON activity_participants(student_id);

ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and teachers manage participants" ON activity_participants;
CREATE POLICY "Director and teachers manage participants"
  ON activity_participants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')));

DROP POLICY IF EXISTS "Students read own participation" ON activity_participants;
CREATE POLICY "Students read own participation"
  ON activity_participants FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read & consent child activities" ON activity_participants;
CREATE POLICY "Parents read & consent child activities"
  ON activity_participants FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = activity_participants.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Parents update consent on child activities" ON activity_participants;
CREATE POLICY "Parents update consent on child activities"
  ON activity_participants FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = activity_participants.student_id
        AND parent_students.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = activity_participants.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

-- =============================================================================
-- 3) PARENT_MEETINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS parent_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type text NOT NULL CHECK (meeting_type IN ('klase', 'individuale', 'pergjithshme')),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_date date NOT NULL,
  start_time time,
  end_time time,
  location text DEFAULT '',
  agenda text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'planifikuar' CHECK (status IN ('planifikuar', 'mbajtur', 'anuluar', 'shtyer')),
  organized_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_meetings_class_idx ON parent_meetings(class_id);
CREATE INDEX IF NOT EXISTS parent_meetings_student_idx ON parent_meetings(student_id);
CREATE INDEX IF NOT EXISTS parent_meetings_date_idx ON parent_meetings(meeting_date DESC);

ALTER TABLE parent_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director and teachers manage parent_meetings" ON parent_meetings;
CREATE POLICY "Director and teachers manage parent_meetings"
  ON parent_meetings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('drejtor', 'mesues')));

DROP POLICY IF EXISTS "Parents read relevant meetings" ON parent_meetings;
CREATE POLICY "Parents read relevant meetings"
  ON parent_meetings FOR SELECT TO authenticated
  USING (
    -- takimi i individual: prindi sheh nëse është i fëmijës së tij
    (student_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = parent_meetings.student_id
        AND parent_students.parent_id = auth.uid()
    ))
    -- takimi i klasës: prindi sheh nëse fëmija është në atë klasë
    OR (class_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN student_classes sc ON sc.student_id = ps.student_id
      WHERE ps.parent_id = auth.uid()
        AND sc.class_id = parent_meetings.class_id
    ))
    -- takimi i përgjithshëm: të gjithë prindërit shohin
    OR meeting_type = 'pergjithshme'
  );
