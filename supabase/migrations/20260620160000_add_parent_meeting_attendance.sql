/*
  # P3: Parent-meeting attendance tracking

  Records which students' parents attended a parent meeting (UA 19/2018 —
  pedagogical documentation). RLS: the meeting organiser manages attendance for
  their meetings; parents read their own child's attendance; the director reads
  all.
*/

CREATE TABLE IF NOT EXISTS public.parent_meeting_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.parent_meetings(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended boolean NOT NULL DEFAULT false,
  notes text DEFAULT ''::text,
  recorded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT parent_meeting_attendance_unique UNIQUE (meeting_id, student_id)
);

ALTER TABLE public.parent_meeting_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pma_read ON public.parent_meeting_attendance;
CREATE POLICY pma_read ON public.parent_meeting_attendance
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'drejtor'::text
    OR EXISTS (
      SELECT 1 FROM public.parent_meetings pm
      WHERE pm.id = parent_meeting_attendance.meeting_id AND pm.organized_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = parent_meeting_attendance.student_id
    )
  );

DROP POLICY IF EXISTS pma_insert ON public.parent_meeting_attendance;
CREATE POLICY pma_insert ON public.parent_meeting_attendance
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parent_meetings pm
    WHERE pm.id = parent_meeting_attendance.meeting_id AND pm.organized_by = auth.uid()
  ));

DROP POLICY IF EXISTS pma_update ON public.parent_meeting_attendance;
CREATE POLICY pma_update ON public.parent_meeting_attendance
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_meetings pm
    WHERE pm.id = parent_meeting_attendance.meeting_id AND pm.organized_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parent_meetings pm
    WHERE pm.id = parent_meeting_attendance.meeting_id AND pm.organized_by = auth.uid()
  ));

DROP POLICY IF EXISTS pma_delete ON public.parent_meeting_attendance;
CREATE POLICY pma_delete ON public.parent_meeting_attendance
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.parent_meetings pm
    WHERE pm.id = parent_meeting_attendance.meeting_id AND pm.organized_by = auth.uid()
  ));
