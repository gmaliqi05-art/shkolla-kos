-- Paketa 64: Update unique constraint në attendance për të përfshirë subject_id
--
-- Pa këtë, dy mësues që mësojnë në të njëjtën klasë në të njëjtën datë
-- nuk mund të regjistrojnë frekuentim të veçantë për lëndët e tyre.
-- Frekuentimi në Kosovë regjistrohet PËR LËNDË jo për ditë.

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_class_id_date_key;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_class_subject_date_key
  UNIQUE (student_id, class_id, subject_id, date);
