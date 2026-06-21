/*
  # Performance: covering indexes for foreign keys on this session's tables

  The Supabase performance advisor flags foreign-key columns without a covering
  index (suboptimal joins and cascade deletes). This adds indexes for the FK
  columns on the tables introduced in this session — these are exactly the
  columns the new RLS policies and page queries join/filter on.

  Columns that are already the leading column of a UNIQUE constraint (e.g.
  homework_submissions.homework_id, retake_exams.student_id,
  peer_assessments.session_id, parent_meeting_attendance.meeting_id,
  accommodation_feedback.accommodation_id) are already covered and are skipped.

  All idempotent (CREATE INDEX IF NOT EXISTS).
*/

-- homework / homework_submissions
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON public.homework(class_id);
CREATE INDEX IF NOT EXISTS idx_homework_subject_id ON public.homework(subject_id);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_id ON public.homework(teacher_id);
CREATE INDEX IF NOT EXISTS idx_homework_submissions_student_id ON public.homework_submissions(student_id);

-- counseling_notes
CREATE INDEX IF NOT EXISTS idx_counseling_notes_student_id ON public.counseling_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_notes_pedagog_id ON public.counseling_notes(pedagog_id);

-- retake_exams
CREATE INDEX IF NOT EXISTS idx_retake_exams_subject_id ON public.retake_exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_retake_exams_class_id ON public.retake_exams(class_id);
CREATE INDEX IF NOT EXISTS idx_retake_exams_examiner_id ON public.retake_exams(examiner_id);
CREATE INDEX IF NOT EXISTS idx_retake_exams_academic_year_id ON public.retake_exams(academic_year_id);

-- parent_meeting_attendance
CREATE INDEX IF NOT EXISTS idx_parent_meeting_attendance_student_id ON public.parent_meeting_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_meeting_attendance_recorded_by ON public.parent_meeting_attendance(recorded_by);

-- accommodation_feedback
CREATE INDEX IF NOT EXISTS idx_accommodation_feedback_teacher_id ON public.accommodation_feedback(teacher_id);

-- peer_assessment_sessions / peer_assessments
CREATE INDEX IF NOT EXISTS idx_peer_assessment_sessions_class_id ON public.peer_assessment_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_peer_assessment_sessions_subject_id ON public.peer_assessment_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_peer_assessment_sessions_teacher_id ON public.peer_assessment_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_peer_assessments_assessor_id ON public.peer_assessments(assessor_id);
CREATE INDEX IF NOT EXISTS idx_peer_assessments_assessed_id ON public.peer_assessments(assessed_id);
