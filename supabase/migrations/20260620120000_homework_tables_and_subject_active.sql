/*
  # Homework module tables + subject_grades.is_active

  This migration reconciles schema drift: the `homework` and
  `homework_submissions` tables already exist in the deployed database
  (and are used by src/pages/teacher/HomeworkPage.tsx and the student
  homework views) but were never captured in a migration file. A fresh
  database built from migrations would therefore be missing them, causing
  HomeworkPage to fail on load/save.

  It also adds the `is_active` column to `subject_grades`, which the
  director subject-management UI (src/pages/teacher/SubjectsPage.tsx)
  toggles. Previously the toggle only mutated local React state and reset
  on reload because no column existed.

  Everything here is idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS)
  so it is a no-op against the already-migrated production database and a
  faithful create against a fresh one.

  Assessment grade range (1–5) follows the Kosovo grading system
  (UA 06/2022). RLS mirrors the policies already live in production.
*/

-- ---------------------------------------------------------------------------
-- homework
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text DEFAULT ''::text,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  attachment_url text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT homework_check CHECK (due_date >= assigned_date)
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hw_read_all ON public.homework;
CREATE POLICY hw_read_all ON public.homework
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS hw_insert_teacher ON public.homework;
CREATE POLICY hw_insert_teacher ON public.homework
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = ANY (ARRAY['mesues'::text, 'drejtor'::text])
  );

DROP POLICY IF EXISTS hw_update_owner ON public.homework;
CREATE POLICY hw_update_owner ON public.homework
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS hw_delete_owner ON public.homework;
CREATE POLICY hw_delete_owner ON public.homework
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
-- homework_submissions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'e_pa_dorezuar'::text,
  submission_text text DEFAULT ''::text,
  attachment_url text DEFAULT ''::text,
  submitted_at timestamptz,
  grade numeric,
  teacher_feedback text DEFAULT ''::text,
  reviewed_at timestamptz,
  CONSTRAINT homework_submissions_status_check
    CHECK (status = ANY (ARRAY['e_pa_dorezuar'::text, 'dorezuar'::text, 'vleresuar'::text])),
  CONSTRAINT homework_submissions_grade_check
    CHECK (grade IS NULL OR (grade >= 1::numeric AND grade <= 5::numeric)),
  CONSTRAINT homework_submissions_homework_id_student_id_key
    UNIQUE (homework_id, student_id)
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hws_student_read ON public.homework_submissions;
CREATE POLICY hws_student_read ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS hws_parent_read ON public.homework_submissions;
CREATE POLICY hws_parent_read ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.parent_id = auth.uid() AND ps.student_id = homework_submissions.student_id
  ));

DROP POLICY IF EXISTS hws_teacher_read ON public.homework_submissions;
CREATE POLICY hws_teacher_read ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS hws_student_submit ON public.homework_submissions;
CREATE POLICY hws_student_submit ON public.homework_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS hws_student_update ON public.homework_submissions;
CREATE POLICY hws_student_update ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS hws_teacher_grade ON public.homework_submissions;
CREATE POLICY hws_teacher_grade ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_submissions.homework_id AND h.teacher_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- subject_grades.is_active
-- ---------------------------------------------------------------------------
ALTER TABLE public.subject_grades
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
