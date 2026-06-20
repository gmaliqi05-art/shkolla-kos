/*
  # P3: Retake / class exams (provim i riprovimit / provim i klasës) — UA 06/2022

  A student who fails the annual grade in a subject sits a retake exam
  (riprovim, organised end of school year). This records the result, distinct
  from the regular grades stream.

  RLS mirrors the grades table: the examining teacher manages rows for classes
  /subjects they teach; the student and their parents can read their own; the
  director reads all (same role-based policy used for grades).
*/

CREATE TABLE IF NOT EXISTS public.retake_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id),
  exam_type text NOT NULL DEFAULT 'riprovim',
  annual_grade integer,
  exam_date date NOT NULL DEFAULT CURRENT_DATE,
  exam_grade integer NOT NULL,
  result text NOT NULL,
  examiner_id uuid NOT NULL REFERENCES public.profiles(id),
  notes text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT retake_exam_grade_check CHECK (exam_grade >= 1 AND exam_grade <= 5),
  CONSTRAINT retake_annual_grade_check CHECK (annual_grade IS NULL OR (annual_grade >= 1 AND annual_grade <= 5)),
  CONSTRAINT retake_result_check CHECK (result = ANY (ARRAY['kaloi'::text, 'ngeli'::text])),
  CONSTRAINT retake_exam_type_check CHECK (exam_type = ANY (ARRAY['riprovim'::text, 'provim_klases'::text])),
  CONSTRAINT retake_exams_unique UNIQUE (student_id, subject_id, academic_year_id, exam_type)
);

ALTER TABLE public.retake_exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students read own retake exams" ON public.retake_exams;
CREATE POLICY "Students read own retake exams" ON public.retake_exams
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parents read children retake exams" ON public.retake_exams;
CREATE POLICY "Parents read children retake exams" ON public.retake_exams
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = retake_exams.student_id
  ));

DROP POLICY IF EXISTS "Teachers read relevant retake exams" ON public.retake_exams;
CREATE POLICY "Teachers read relevant retake exams" ON public.retake_exams
  FOR SELECT TO authenticated
  USING (
    examiner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = retake_exams.class_id
        AND cs.subject_id = retake_exams.subject_id
        AND cs.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Directors read all retake exams" ON public.retake_exams;
CREATE POLICY "Directors read all retake exams" ON public.retake_exams
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'drejtor'::text);

DROP POLICY IF EXISTS "Teachers insert retake exams" ON public.retake_exams;
CREATE POLICY "Teachers insert retake exams" ON public.retake_exams
  FOR INSERT TO authenticated
  WITH CHECK (
    examiner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.class_subjects cs
      WHERE cs.class_id = retake_exams.class_id
        AND cs.subject_id = retake_exams.subject_id
        AND cs.teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers update own retake exams" ON public.retake_exams;
CREATE POLICY "Teachers update own retake exams" ON public.retake_exams
  FOR UPDATE TO authenticated
  USING (examiner_id = auth.uid())
  WITH CHECK (examiner_id = auth.uid());

DROP POLICY IF EXISTS "Teachers delete own retake exams" ON public.retake_exams;
CREATE POLICY "Teachers delete own retake exams" ON public.retake_exams
  FOR DELETE TO authenticated
  USING (examiner_id = auth.uid());
