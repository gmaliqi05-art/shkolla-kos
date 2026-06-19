/*
  # Kalendari Shkollor (school_calendar) — paritet repo ↔ bazë

  Kjo tabelë EKZISTON në bazën live por migrimi i saj kishte humbur nga repo
  (drift). Skedari e rikrijon saktësisht skemën që një deploy i ri ta
  ndërtojë; src/pages/director/SchoolCalendar.tsx e përdor këtë tabelë.

  Vendimi Vjetor i MAShTI për Kalendarin Shkollor: festa, pushime, periudha
  provimesh, ditë jo-pune.

  SHËNIM: politika e leximit (scal_read_all = USING(true)) është riprodhuar
  ashtu siç është në bazë.
*/

CREATE TABLE IF NOT EXISTS school_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  date date NOT NULL,
  event_type text NOT NULL DEFAULT 'ngjarje'
    CHECK (event_type = ANY (ARRAY['pushim', 'feste', 'provim', 'ngjarje', 'mbledhje_prinderit', 'tjeter'])),
  title text NOT NULL,
  description text DEFAULT ''::text,
  is_school_day boolean NOT NULL DEFAULT true,
  target_grade_levels integer[],
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE (academic_year_id, date, title)
);

ALTER TABLE school_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scal_read_all" ON school_calendar;
CREATE POLICY "scal_read_all" ON school_calendar
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "scal_insert_dir" ON school_calendar;
CREATE POLICY "scal_insert_dir" ON school_calendar
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

DROP POLICY IF EXISTS "scal_update_dir" ON school_calendar;
CREATE POLICY "scal_update_dir" ON school_calendar
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

DROP POLICY IF EXISTS "scal_delete_dir" ON school_calendar;
CREATE POLICY "scal_delete_dir" ON school_calendar
  FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
