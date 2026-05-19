/*
  # Add UNIQUE constraints and critical database fixes

  1. Changes
    - Add UNIQUE constraint on attendance(student_id, class_id, date) for upsert support
    - Add UNIQUE constraint on student_classes(student_id, class_id) to prevent duplicate enrollments
    - Add UNIQUE constraint on parent_students(parent_id, student_id) to prevent duplicate links
    - Add UNIQUE constraint on class_subjects(class_id, subject_id) to prevent duplicate assignments
  
  2. Important Notes
    - These constraints ensure data integrity and support upsert operations
    - They prevent accidental duplicate records that could corrupt reporting
    - The attendance constraint is required for the onConflict upsert pattern used in AttendancePage
*/

-- Attendance: one record per student per class per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_class_date 
  ON attendance(student_id, class_id, date);

-- Student classes: one enrollment per student per class
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_classes_student_class 
  ON student_classes(student_id, class_id);

-- Parent students: one link per parent-student pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_students_parent_student 
  ON parent_students(parent_id, student_id);

-- Class subjects: one subject assignment per class (teacher can vary)
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_subjects_class_subject 
  ON class_subjects(class_id, subject_id);
