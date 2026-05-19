/*
  # Paketa 4: Organet Shkollore

  Përputhshmëri me Ligjin Nr. 04/L-032 për Arsimin Parauniversitar:
  - Neni 18 — Këshilli Drejtues i Shkollës (7–9 anëtarë)
  - Neni 19 — Këshilli i Prindërve
  - Neni 20 — Këshilli i Mësimdhënësve / Profesional
  - Neni 23 — Këshilli i Nxënësve

  Çfarë shton:
  1. school_councils — 4 lloje organesh shkollore
  2. council_members — anëtarët me role (kryetar, sekretar, anëtar)
  3. council_meetings — mbledhjet me agjendë
  4. meeting_attendance — frekuentimi i anëtarëve
  5. meeting_minutes — procesverbalet e mbledhjeve
*/

-- =============================================================================
-- 1) SCHOOL_COUNCILS
-- =============================================================================

CREATE TABLE IF NOT EXISTS school_councils (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('drejtues', 'prinder', 'nxenes', 'profesional')),
  name text NOT NULL,
  description text DEFAULT '',
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  established_at date,
  term_ends date,
  created_at timestamptz DEFAULT now(),
  UNIQUE (type, academic_year_id)
);

CREATE INDEX IF NOT EXISTS school_councils_type_idx ON school_councils(type) WHERE is_active = true;

ALTER TABLE school_councils ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages councils" ON school_councils;
CREATE POLICY "Director manages councils"
  ON school_councils FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "All authenticated read councils" ON school_councils;
CREATE POLICY "All authenticated read councils"
  ON school_councils FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- 2) COUNCIL_MEMBERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS council_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id uuid NOT NULL REFERENCES school_councils(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('kryetar', 'zevendes_kryetar', 'sekretar', 'anetar')),
  represents text DEFAULT '',
  joined_at date NOT NULL DEFAULT CURRENT_DATE,
  left_at date,
  is_active boolean DEFAULT true,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE (council_id, user_id, joined_at)
);

CREATE INDEX IF NOT EXISTS council_members_council_idx ON council_members(council_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS council_members_user_idx ON council_members(user_id) WHERE is_active = true;

ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages council members" ON council_members;
CREATE POLICY "Director manages council members"
  ON council_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "All authenticated read council members" ON council_members;
CREATE POLICY "All authenticated read council members"
  ON council_members FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- 3) COUNCIL_MEETINGS
-- =============================================================================

CREATE TABLE IF NOT EXISTS council_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id uuid NOT NULL REFERENCES school_councils(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_date date NOT NULL,
  start_time time,
  end_time time,
  location text DEFAULT '',
  agenda text DEFAULT '',
  status text NOT NULL DEFAULT 'planifikuar' CHECK (status IN ('planifikuar', 'mbajtur', 'anuluar', 'shtyer')),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS council_meetings_council_idx ON council_meetings(council_id);
CREATE INDEX IF NOT EXISTS council_meetings_date_idx ON council_meetings(meeting_date DESC);

ALTER TABLE council_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages meetings" ON council_meetings;
CREATE POLICY "Director manages meetings"
  ON council_meetings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Members read own council meetings" ON council_meetings;
CREATE POLICY "Members read own council meetings"
  ON council_meetings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM council_members
      WHERE council_members.council_id = council_meetings.council_id
        AND council_members.user_id = auth.uid()
        AND council_members.is_active = true
    )
  );

-- Të gjithë mund të shohin mbledhjet (transparencë), por procesverbalet janë të mbrojtura
DROP POLICY IF EXISTS "All authenticated read meetings" ON council_meetings;
CREATE POLICY "All authenticated read meetings"
  ON council_meetings FOR SELECT TO authenticated
  USING (true);

-- =============================================================================
-- 4) MEETING_ATTENDANCE
-- =============================================================================

CREATE TABLE IF NOT EXISTS meeting_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES council_meetings(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES council_members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pa_specifikuar' CHECK (status IN ('pa_specifikuar', 'prezent', 'mungon', 'arsyeshme')),
  notes text DEFAULT '',
  UNIQUE (meeting_id, member_id)
);

CREATE INDEX IF NOT EXISTS meeting_attendance_meeting_idx ON meeting_attendance(meeting_id);

ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages meeting attendance" ON meeting_attendance;
CREATE POLICY "Director manages meeting attendance"
  ON meeting_attendance FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Members read own attendance" ON meeting_attendance;
CREATE POLICY "Members read own attendance"
  ON meeting_attendance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM council_members
      WHERE council_members.id = meeting_attendance.member_id
        AND council_members.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5) MEETING_MINUTES (Procesverbalet)
-- =============================================================================

CREATE TABLE IF NOT EXISTS meeting_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES council_meetings(id) ON DELETE CASCADE,
  content text NOT NULL,
  decisions text DEFAULT '',
  recorded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (meeting_id)
);

ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Director manages minutes" ON meeting_minutes;
CREATE POLICY "Director manages minutes"
  ON meeting_minutes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

DROP POLICY IF EXISTS "Members read own council minutes" ON meeting_minutes;
CREATE POLICY "Members read own council minutes"
  ON meeting_minutes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM council_meetings m
      JOIN council_members cm ON cm.council_id = m.council_id
      WHERE m.id = meeting_minutes.meeting_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );
