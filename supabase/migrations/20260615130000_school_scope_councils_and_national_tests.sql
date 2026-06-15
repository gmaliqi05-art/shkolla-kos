/*
  # Scope sipas shkollës: organet shkollore + testet kombëtare

  Përputhshmëri: Ligji 04/L-032 (organet shkollore), UA për testet e
  arritshmërisë (V & IX), Ligji 06/L-082 (mbrojtja e të dhënave të të miturve).

  PROBLEMI (gjetur nga auditi):
  - school_councils / council_members / council_meetings kishin politika
    SELECT `USING (true)` => çdo përdorues, nga ÇDO shkollë, lexonte
    anëtarësinë dhe mbledhjet e të gjitha shkollave.
  - national_tests dhe national_test_results kishin politikë `FOR ALL`
    që lejonte ÇDO drejtor të editonte katalogun e testeve dhe rezultatet
    e të gjithë nxënësve në vend (qasje ndër-shkolla te të dhëna të të miturve).

  Tabela të prekura s'kishin fare kolonë school_id (ishin dizajnuar single-school).

  ZGJIDHJA:
  1. Helper current_user_school_id() (SECURITY DEFINER, pa recursion).
  2. Shto school_id te school_councils & national_tests, backfill, indekse,
     ndrysho UNIQUE constraint-in e këshillave të përfshijë school_id.
  3. Trigger që plotëson automatikisht school_id nga profili i krijuesit kur
     mungon (që UI ekzistuese e drejtorit të vazhdojë të punojë pa ndryshime).
  4. Rishkruaj politikat RLS që të kufizojnë leximin/shkrimin sipas shkollës,
     me përjashtim mbikëqyrjeje për ministri / inspektor / super_admin dhe DKA
     (vetëm komuna e vet).
*/

-- =============================================================================
-- 0) HELPER: school_id i përdoruesit aktual (pa kaluar nga RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_school_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_school_id() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.current_user_school_id() TO authenticated;

-- Trigger helper: plotëso school_id nga krijuesi kur mungon
CREATE OR REPLACE FUNCTION public.set_school_id_from_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.school_id IS NULL THEN
    NEW.school_id := public.current_user_school_id();
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 1) SCHOOL_COUNCILS — shto school_id, backfill, unique constraint, RLS
-- =============================================================================

ALTER TABLE school_councils
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school_info(id) ON DELETE CASCADE;

-- Backfill nga shkolla e ndonjë anëtari (të dhënat ekzistuese janë testuese)
UPDATE school_councils sc
SET school_id = (
  SELECT p.school_id
  FROM council_members cm
  JOIN profiles p ON p.id = cm.user_id
  WHERE cm.council_id = sc.id AND p.school_id IS NOT NULL
  LIMIT 1
)
WHERE sc.school_id IS NULL;

CREATE INDEX IF NOT EXISTS school_councils_school_idx ON school_councils(school_id);

-- UNIQUE (type, academic_year_id) -> UNIQUE (school_id, type, academic_year_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'school_councils_type_academic_year_id_key') THEN
    ALTER TABLE school_councils DROP CONSTRAINT school_councils_type_academic_year_id_key;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'school_councils_school_type_year_key') THEN
    ALTER TABLE school_councils
      ADD CONSTRAINT school_councils_school_type_year_key UNIQUE (school_id, type, academic_year_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_school_councils_set_school ON school_councils;
CREATE TRIGGER trg_school_councils_set_school
  BEFORE INSERT ON school_councils
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_creator();

-- Drejtori menaxhon vetëm këshillat e shkollës së vet
DROP POLICY IF EXISTS "Director manages councils" ON school_councils;
CREATE POLICY "Director manages councils"
  ON school_councils FOR ALL TO authenticated
  USING (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id())
  WITH CHECK (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id());

-- Lexim: shkolla e vet + mbikëqyrja (ministri/inspektor/super_admin/DKA për komunën)
DROP POLICY IF EXISTS "All authenticated read councils" ON school_councils;
DROP POLICY IF EXISTS "Same school reads councils" ON school_councils;
CREATE POLICY "Same school reads councils"
  ON school_councils FOR SELECT TO authenticated
  USING (
    school_id = public.current_user_school_id()
    OR public.current_user_role() IN ('ministri', 'inspektor', 'super_admin')
    OR (
      public.current_user_role() = 'drejtor_komunal'
      AND school_id IN (
        SELECT id FROM public.school_info WHERE municipality_id = public.current_dka_municipality_id()
      )
    )
  );

-- =============================================================================
-- 2) COUNCIL_MEMBERS — RLS sipas shkollës së këshillit
-- =============================================================================

DROP POLICY IF EXISTS "Director manages council members" ON council_members;
CREATE POLICY "Director manages council members"
  ON council_members FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_members.council_id AND sc.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_members.council_id AND sc.school_id = public.current_user_school_id()
    )
  );

DROP POLICY IF EXISTS "All authenticated read council members" ON council_members;
DROP POLICY IF EXISTS "Same school reads council members" ON council_members;
CREATE POLICY "Same school reads council members"
  ON council_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_members.council_id
        AND (
          sc.school_id = public.current_user_school_id()
          OR public.current_user_role() IN ('ministri', 'inspektor', 'super_admin')
          OR (
            public.current_user_role() = 'drejtor_komunal'
            AND sc.school_id IN (
              SELECT id FROM public.school_info WHERE municipality_id = public.current_dka_municipality_id()
            )
          )
        )
    )
  );

-- =============================================================================
-- 3) COUNCIL_MEETINGS — RLS sipas shkollës së këshillit
-- =============================================================================

DROP POLICY IF EXISTS "Director manages meetings" ON council_meetings;
CREATE POLICY "Director manages meetings"
  ON council_meetings FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_meetings.council_id AND sc.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_meetings.council_id AND sc.school_id = public.current_user_school_id()
    )
  );

-- Heq leximin global; mbahet "Members read own council meetings" + shtohet shkolla/mbikëqyrja
DROP POLICY IF EXISTS "All authenticated read meetings" ON council_meetings;
DROP POLICY IF EXISTS "Same school reads meetings" ON council_meetings;
CREATE POLICY "Same school reads meetings"
  ON council_meetings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM school_councils sc
      WHERE sc.id = council_meetings.council_id
        AND (
          sc.school_id = public.current_user_school_id()
          OR public.current_user_role() IN ('ministri', 'inspektor', 'super_admin')
          OR (
            public.current_user_role() = 'drejtor_komunal'
            AND sc.school_id IN (
              SELECT id FROM public.school_info WHERE municipality_id = public.current_dka_municipality_id()
            )
          )
        )
    )
  );

-- =============================================================================
-- 4) MEETING_ATTENDANCE — kufizo menaxhimin e drejtorit te shkolla e vet
-- =============================================================================

DROP POLICY IF EXISTS "Director manages meeting attendance" ON meeting_attendance;
CREATE POLICY "Director manages meeting attendance"
  ON meeting_attendance FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM council_meetings m
      JOIN school_councils sc ON sc.id = m.council_id
      WHERE m.id = meeting_attendance.meeting_id AND sc.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM council_meetings m
      JOIN school_councils sc ON sc.id = m.council_id
      WHERE m.id = meeting_attendance.meeting_id AND sc.school_id = public.current_user_school_id()
    )
  );

-- =============================================================================
-- 5) MEETING_MINUTES — kufizo menaxhimin e drejtorit te shkolla e vet
-- =============================================================================

DROP POLICY IF EXISTS "Director manages minutes" ON meeting_minutes;
CREATE POLICY "Director manages minutes"
  ON meeting_minutes FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM council_meetings m
      JOIN school_councils sc ON sc.id = m.council_id
      WHERE m.id = meeting_minutes.meeting_id AND sc.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM council_meetings m
      JOIN school_councils sc ON sc.id = m.council_id
      WHERE m.id = meeting_minutes.meeting_id AND sc.school_id = public.current_user_school_id()
    )
  );

-- =============================================================================
-- 6) NATIONAL_TESTS — shto school_id, trigger, RLS sipas shkollës
-- =============================================================================

ALTER TABLE national_tests
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES school_info(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS national_tests_school_idx ON national_tests(school_id);

DROP TRIGGER IF EXISTS trg_national_tests_set_school ON national_tests;
CREATE TRIGGER trg_national_tests_set_school
  BEFORE INSERT ON national_tests
  FOR EACH ROW EXECUTE FUNCTION public.set_school_id_from_creator();

-- Drejtori menaxhon testet e shkollës së vet; ministri/super_admin menaxhojnë gjithçka
DROP POLICY IF EXISTS "Director manages national_tests" ON national_tests;
CREATE POLICY "Director manages national_tests"
  ON national_tests FOR ALL TO authenticated
  USING (
    (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id())
    OR public.current_user_role() IN ('ministri', 'super_admin')
  )
  WITH CHECK (
    (public.current_user_role() = 'drejtor' AND school_id = public.current_user_school_id())
    OR public.current_user_role() IN ('ministri', 'super_admin')
  );

DROP POLICY IF EXISTS "All authenticated read national_tests" ON national_tests;
DROP POLICY IF EXISTS "Same school reads national_tests" ON national_tests;
CREATE POLICY "Same school reads national_tests"
  ON national_tests FOR SELECT TO authenticated
  USING (
    school_id = public.current_user_school_id()
    OR public.current_user_role() IN ('ministri', 'inspektor', 'super_admin')
    OR (
      public.current_user_role() = 'drejtor_komunal'
      AND school_id IN (
        SELECT id FROM public.school_info WHERE municipality_id = public.current_dka_municipality_id()
      )
    )
  );

-- =============================================================================
-- 7) NATIONAL_TEST_RESULTS — kufizo drejtorin te nxënësit e shkollës së vet
-- =============================================================================

DROP POLICY IF EXISTS "Director manages test_results" ON national_test_results;
CREATE POLICY "Director manages test_results"
  ON national_test_results FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = national_test_results.student_id AND p.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = national_test_results.student_id AND p.school_id = public.current_user_school_id()
    )
  );

-- Politikat e leximit për nxënësin/prindin/mësuesin mbeten siç janë.
