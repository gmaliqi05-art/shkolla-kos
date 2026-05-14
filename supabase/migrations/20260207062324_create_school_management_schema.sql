/*
  # School Management System - Complete Schema

  1. New Tables
    - `profiles` - User profiles extending auth.users
    - `academic_years` - Academic years
    - `classes` - School classes grades 1-9
    - `subjects` - School subjects
    - `class_subjects` - Maps classes to subjects and teachers
    - `student_classes` - Student enrollment in classes
    - `parent_students` - Parent-student relationships
    - `grades` - Student grades (scale 4-10)
    - `attendance` - Daily attendance records
    - `announcements` - School announcements
    - `schedule` - Weekly timetable

  2. Security
    - RLS enabled on ALL tables with role-based policies

  3. Notes
    - Tables created first, then policies added to avoid circular references
*/

-- 1. Create all tables first (no policies yet)

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL CHECK (role IN ('drejtor', 'mesues', 'nxenes', 'prind')) DEFAULT 'nxenes',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade_level integer NOT NULL CHECK (grade_level BETWEEN 1 AND 9),
  section text DEFAULT 'A',
  academic_year_id uuid REFERENCES academic_years(id),
  homeroom_teacher_id uuid REFERENCES profiles(id),
  max_students integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parent_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship text DEFAULT 'prind',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  grade numeric(4,2) NOT NULL CHECK (grade BETWEEN 4 AND 10),
  grade_type text NOT NULL CHECK (grade_type IN ('detyre', 'test', 'provim', 'projekt', 'oral')) DEFAULT 'test',
  description text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  semester integer DEFAULT 1 CHECK (semester IN (1, 2)),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status IN ('prezent', 'mungon', 'vonese', 'arsyeshme')) DEFAULT 'prezent',
  note text DEFAULT '',
  recorded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id),
  target_role text CHECK (target_role IN ('te_gjithe', 'mesues', 'nxenes', 'prind')) DEFAULT 'te_gjithe',
  is_important boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;

-- 3. Profiles policies

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Directors can read all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor')
  );

CREATE POLICY "Teachers can read relevant profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'mesues')
    AND role IN ('nxenes', 'prind', 'mesues')
  );

CREATE POLICY "Parents can read children profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = profiles.id
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Directors can update all profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 4. Academic years policies

CREATE POLICY "Authenticated can read academic years"
  ON academic_years FOR SELECT TO authenticated USING (true);

CREATE POLICY "Directors can insert academic years"
  ON academic_years FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can update academic years"
  ON academic_years FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 5. Classes policies

CREATE POLICY "Authenticated can read classes"
  ON classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Directors can insert classes"
  ON classes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can update classes"
  ON classes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can delete classes"
  ON classes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 6. Subjects policies

CREATE POLICY "Authenticated can read subjects"
  ON subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Directors can insert subjects"
  ON subjects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can update subjects"
  ON subjects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 7. Class subjects policies

CREATE POLICY "Authenticated can read class subjects"
  ON class_subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Directors can insert class subjects"
  ON class_subjects FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can update class subjects"
  ON class_subjects FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can delete class subjects"
  ON class_subjects FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 8. Student classes policies

CREATE POLICY "Directors can read all enrollments"
  ON student_classes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Teachers can read enrollments for their classes"
  ON student_classes FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM class_subjects cs WHERE cs.class_id = student_classes.class_id AND cs.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM classes c WHERE c.id = student_classes.class_id AND c.homeroom_teacher_id = auth.uid())
  );

CREATE POLICY "Students can read own enrollment"
  ON student_classes FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read children enrollments"
  ON student_classes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = student_classes.student_id));

CREATE POLICY "Directors can insert enrollments"
  ON student_classes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can delete enrollments"
  ON student_classes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 9. Parent students policies

CREATE POLICY "Directors can read all parent-student links"
  ON parent_students FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Parents can read own links"
  ON parent_students FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Students can read own parent links"
  ON parent_students FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Directors can insert parent-student links"
  ON parent_students FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can delete parent-student links"
  ON parent_students FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 10. Grades policies

CREATE POLICY "Directors can read all grades"
  ON grades FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Teachers can read grades they gave"
  ON grades FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read own grades"
  ON grades FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read children grades"
  ON grades FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = grades.student_id));

CREATE POLICY "Teachers can insert grades"
  ON grades FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND EXISTS (SELECT 1 FROM class_subjects cs WHERE cs.class_id = grades.class_id AND cs.subject_id = grades.subject_id AND cs.teacher_id = auth.uid())
  );

CREATE POLICY "Teachers can update own grades"
  ON grades FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own grades"
  ON grades FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- 11. Attendance policies

CREATE POLICY "Directors can read all attendance"
  ON attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Teachers can read attendance they recorded"
  ON attendance FOR SELECT TO authenticated
  USING (recorded_by = auth.uid());

CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Parents can read children attendance"
  ON attendance FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance.student_id));

CREATE POLICY "Teachers can insert attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (recorded_by = auth.uid() AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'mesues'));

CREATE POLICY "Teachers can update own attendance"
  ON attendance FOR UPDATE TO authenticated
  USING (recorded_by = auth.uid())
  WITH CHECK (recorded_by = auth.uid());

-- 12. Announcements policies

CREATE POLICY "Users can read targeted announcements"
  ON announcements FOR SELECT TO authenticated
  USING (
    target_role = 'te_gjithe'
    OR target_role = (SELECT role FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor')
  );

CREATE POLICY "Directors and teachers can insert announcements"
  ON announcements FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('drejtor', 'mesues'))
  );

CREATE POLICY "Authors can update own announcements"
  ON announcements FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete own announcements"
  ON announcements FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- 13. Schedule policies

CREATE POLICY "Authenticated can read schedule"
  ON schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Directors can insert schedule"
  ON schedule FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can update schedule"
  ON schedule FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

CREATE POLICY "Directors can delete schedule"
  ON schedule FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'drejtor'));

-- 14. Indexes

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_student ON student_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_student_classes_class ON student_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_date ON grades(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_schedule_class ON schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON parent_students(student_id);