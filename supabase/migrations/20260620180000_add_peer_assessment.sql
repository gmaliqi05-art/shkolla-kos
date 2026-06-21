/*
  # P3: Peer assessment (vlerësim nga bashkëmoshatari) — UA 06/2022

  A teacher opens a peer-assessment session for a class/subject (e.g. group
  work); students then rate their peers 1–5 with an optional comment. Ratings
  are visible to the rater and the session's teacher (and director) only — never
  to the assessed student — to preserve anonymity.

  Two SECURITY DEFINER helpers avoid RLS-recursion / cross-student profile
  exposure:
   - is_student_in_class(student, class) — membership check used inside policies.
   - peer_session_students(session) — returns id+full_name of classmates to a
     student in that class, without broadening profile RLS.
*/

CREATE OR REPLACE FUNCTION public.is_student_in_class(p_student uuid, p_class uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_classes
    WHERE student_id = p_student AND class_id = p_class
  );
$$;

CREATE TABLE IF NOT EXISTS public.peer_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text DEFAULT ''::text,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.peer_assessment_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pas_read ON public.peer_assessment_sessions;
CREATE POLICY pas_read ON public.peer_assessment_sessions
  FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid()
    OR public.current_user_role() = 'drejtor'::text
    OR public.is_student_in_class(auth.uid(), class_id)
  );

DROP POLICY IF EXISTS pas_insert ON public.peer_assessment_sessions;
CREATE POLICY pas_insert ON public.peer_assessment_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = peer_assessment_sessions.class_id
        AND cs.subject_id = peer_assessment_sessions.subject_id
        AND cs.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS pas_update ON public.peer_assessment_sessions;
CREATE POLICY pas_update ON public.peer_assessment_sessions
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS pas_delete ON public.peer_assessment_sessions;
CREATE POLICY pas_delete ON public.peer_assessment_sessions
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.peer_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.peer_assessment_sessions(id) ON DELETE CASCADE,
  assessor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL,
  comment text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT peer_assessments_score_check CHECK (score >= 1 AND score <= 5),
  CONSTRAINT peer_assessments_no_self CHECK (assessor_id <> assessed_id),
  CONSTRAINT peer_assessments_unique UNIQUE (session_id, assessor_id, assessed_id)
);

ALTER TABLE public.peer_assessments ENABLE ROW LEVEL SECURITY;

-- Read: the rater, the session teacher, the director. NOT the assessed student.
DROP POLICY IF EXISTS pa_read ON public.peer_assessments;
CREATE POLICY pa_read ON public.peer_assessments
  FOR SELECT TO authenticated
  USING (
    assessor_id = auth.uid()
    OR public.current_user_role() = 'drejtor'::text
    OR EXISTS (
      SELECT 1 FROM public.peer_assessment_sessions s
      WHERE s.id = peer_assessments.session_id AND s.teacher_id = auth.uid()
    )
  );

-- Insert: rater = self, both rater and ratee in the class, session open.
DROP POLICY IF EXISTS pa_insert ON public.peer_assessments;
CREATE POLICY pa_insert ON public.peer_assessments
  FOR INSERT TO authenticated
  WITH CHECK (
    assessor_id = auth.uid()
    AND assessor_id <> assessed_id
    AND EXISTS (
      SELECT 1 FROM public.peer_assessment_sessions s
      WHERE s.id = peer_assessments.session_id
        AND s.is_open
        AND public.is_student_in_class(auth.uid(), s.class_id)
        AND public.is_student_in_class(peer_assessments.assessed_id, s.class_id)
    )
  );

DROP POLICY IF EXISTS pa_update ON public.peer_assessments;
CREATE POLICY pa_update ON public.peer_assessments
  FOR UPDATE TO authenticated
  USING (assessor_id = auth.uid())
  WITH CHECK (
    assessor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.peer_assessment_sessions s
      WHERE s.id = peer_assessments.session_id AND s.is_open
    )
  );

DROP POLICY IF EXISTS pa_delete ON public.peer_assessments;
CREATE POLICY pa_delete ON public.peer_assessments
  FOR DELETE TO authenticated
  USING (assessor_id = auth.uid());

-- Classmates list for a student in the session's class (name only).
CREATE OR REPLACE FUNCTION public.peer_session_students(p_session uuid)
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT p.id, p.full_name
  FROM public.peer_assessment_sessions s
  JOIN public.student_classes sc ON sc.class_id = s.class_id
  JOIN public.profiles p ON p.id = sc.student_id
  WHERE s.id = p_session
    AND p.deleted_at IS NULL
    AND public.is_student_in_class(auth.uid(), s.class_id)
  ORDER BY p.full_name;
$$;
