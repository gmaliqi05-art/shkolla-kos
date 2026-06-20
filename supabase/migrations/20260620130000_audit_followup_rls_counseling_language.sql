/*
  # Audit follow-up: same-school journal/calendar reads, counseling notes,
  #                  language of instruction

  Addresses findings from the legal/security audit:

  1. class_journal & school_calendar were readable with USING(true) — any
     authenticated user could read pedagogical journals and calendars of any
     school in the country. Restrict SELECT to same-school (+ oversight
     roles), mirroring the pattern used on school_councils / national_tests.

  2. counseling_notes: confidential pedagogue/psychologist notes about a
     student, kept separate from grades with strict RLS (only the authoring
     pedagogue and the director of the same school). UA 19/2018 + Ligji
     06/L-082 (data minimisation / confidentiality of minors' data).

  3. classes.language_of_instruction (Ligji 04/L-032 Neni 12 + Ligji
     02/L-37): the teaching language of a class.

  Idempotent: DROP POLICY IF EXISTS / CREATE TABLE IF NOT EXISTS /
  ADD COLUMN IF NOT EXISTS, plus a guarded constraint add.
*/

-- ---------------------------------------------------------------------------
-- 1a. class_journal — same-school SELECT
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS cj_read_all ON public.class_journal;
DROP POLICY IF EXISTS cj_read_same_school ON public.class_journal;
CREATE POLICY cj_read_same_school ON public.class_journal
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = ANY (ARRAY['ministri'::text, 'inspektor'::text, 'super_admin'::text])
    OR EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_journal.class_id
        AND (
          c.school_id = public.current_user_school_id()
          OR (
            public.current_user_role() = 'drejtor_komunal'::text
            AND c.school_id IN (
              SELECT si.id FROM public.school_info si
              WHERE si.municipality_id = public.current_dka_municipality_id()
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 1b. school_calendar — same-school SELECT (school derived via created_by)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS scal_read_all ON public.school_calendar;
DROP POLICY IF EXISTS scal_read_same_school ON public.school_calendar;
CREATE POLICY scal_read_same_school ON public.school_calendar
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = ANY (ARRAY['ministri'::text, 'inspektor'::text, 'super_admin'::text])
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = school_calendar.created_by
        AND (
          p.school_id = public.current_user_school_id()
          OR (
            public.current_user_role() = 'drejtor_komunal'::text
            AND p.school_id IN (
              SELECT si.id FROM public.school_info si
              WHERE si.municipality_id = public.current_dka_municipality_id()
            )
          )
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 1c. profiles — pedagogue same-school read (was missing: pedagogues could not
--     read student/parent profiles at all, breaking NVA/PIA, diagnostics and
--     the new counseling notes). Mirrors the teacher policy (same school,
--     limited roles) per Ligji 06/L-082 data minimisation.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Pedagogues can read relevant profiles" ON public.profiles;
CREATE POLICY "Pedagogues can read relevant profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'pedagog'::text
    AND role = ANY (ARRAY['nxenes'::text, 'prind'::text, 'mesues'::text])
    AND school_id = public.current_user_school_id()
  );

-- ---------------------------------------------------------------------------
-- 2. counseling_notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.counseling_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pedagog_id uuid NOT NULL REFERENCES public.profiles(id),
  category text NOT NULL DEFAULT 'keshillim',
  title text NOT NULL,
  note text NOT NULL DEFAULT ''::text,
  is_confidential boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT counseling_notes_category_check
    CHECK (category = ANY (ARRAY['keshillim'::text, 'sjellje'::text, 'akademik'::text, 'emocional'::text, 'familjar'::text, 'tjeter'::text]))
);

ALTER TABLE public.counseling_notes ENABLE ROW LEVEL SECURITY;

-- Read: authoring pedagogue or director of the same school (or super_admin).
DROP POLICY IF EXISTS cn_read ON public.counseling_notes;
CREATE POLICY cn_read ON public.counseling_notes
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'super_admin'::text
    OR (
      public.current_user_role() = ANY (ARRAY['pedagog'::text, 'drejtor'::text])
      AND EXISTS (
        SELECT 1 FROM public.profiles s
        WHERE s.id = counseling_notes.student_id
          AND s.school_id = public.current_user_school_id()
      )
    )
  );

-- Insert: only a pedagogue, for a student in their school, as themselves.
DROP POLICY IF EXISTS cn_insert ON public.counseling_notes;
CREATE POLICY cn_insert ON public.counseling_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    pedagog_id = auth.uid()
    AND public.current_user_role() = 'pedagog'::text
    AND EXISTS (
      SELECT 1 FROM public.profiles s
      WHERE s.id = counseling_notes.student_id
        AND s.school_id = public.current_user_school_id()
    )
  );

-- Update / delete: only the authoring pedagogue.
DROP POLICY IF EXISTS cn_update ON public.counseling_notes;
CREATE POLICY cn_update ON public.counseling_notes
  FOR UPDATE TO authenticated
  USING (pedagog_id = auth.uid())
  WITH CHECK (pedagog_id = auth.uid());

DROP POLICY IF EXISTS cn_delete ON public.counseling_notes;
CREATE POLICY cn_delete ON public.counseling_notes
  FOR DELETE TO authenticated
  USING (pedagog_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 3. classes.language_of_instruction
-- ---------------------------------------------------------------------------
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS language_of_instruction text NOT NULL DEFAULT 'shqip';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_language_of_instruction_check'
  ) THEN
    ALTER TABLE public.classes
      ADD CONSTRAINT classes_language_of_instruction_check
      CHECK (language_of_instruction = ANY (ARRAY['shqip'::text, 'serbisht'::text, 'turqisht'::text, 'boshnjakisht'::text, 'anglisht'::text]));
  END IF;
END $$;
