/*
  # P3: IEP accommodation effectiveness feedback

  Lets the teacher record how effective an IEP accommodation is in practice,
  feeding the periodic PIA review (UA 19/2018). One feedback row per teacher per
  accommodation (latest wins via upsert).

  RLS: teachers manage their own feedback; pedagogues and directors (who run the
  PIA review) can read it.
*/

CREATE TABLE IF NOT EXISTS public.accommodation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accommodation_id uuid NOT NULL REFERENCES public.iep_accommodations(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id),
  effectiveness text NOT NULL,
  comment text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT accommodation_feedback_effectiveness_check
    CHECK (effectiveness = ANY (ARRAY['efektiv'::text, 'pjeserisht'::text, 'joefektiv'::text])),
  CONSTRAINT accommodation_feedback_unique UNIQUE (accommodation_id, teacher_id)
);

ALTER TABLE public.accommodation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS af_read ON public.accommodation_feedback;
CREATE POLICY af_read ON public.accommodation_feedback
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR public.current_user_role() = ANY (ARRAY['pedagog'::text, 'drejtor'::text])
  );

DROP POLICY IF EXISTS af_insert ON public.accommodation_feedback;
CREATE POLICY af_insert ON public.accommodation_feedback
  FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid() AND public.current_user_role() = 'mesues'::text);

DROP POLICY IF EXISTS af_update ON public.accommodation_feedback;
CREATE POLICY af_update ON public.accommodation_feedback
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS af_delete ON public.accommodation_feedback;
CREATE POLICY af_delete ON public.accommodation_feedback
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());
