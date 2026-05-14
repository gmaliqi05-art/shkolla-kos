/*
  # Shkolla Kos — Skema Komplete (Konsoliduar)

  Ky migrim zëvendëson të gjitha 8 migrimet e mëparshme.
  Për deploy të ri, fshini skedarët e vjetër dhe përdorni vetëm këtë.

  ## Tabela
  - profiles            — Profilet e përdoruesve (drejtor, mesues, nxenes, prind)
  - academic_years      — Vitet shkollore
  - classes             — Klasat 1-9
  - subjects            — Lëndët mësimore
  - subject_grades      — Hartëzimi lëndë-klasë sipas KKK Kosovo
  - class_subjects      — Caktimi mësues → klasë → lëndë
  - student_classes     — Regjistrimi nxënës në klasë
  - parent_students     — Lidhja prind-fëmijë
  - grades              — Notat (shkallë 1-5, sistem vlerësimi Kosovo)
  - attendance          — Frekuentimi ditor
  - announcements       — Njoftimet shkollore
  - schedule            — Orari javor
  - messages            — Mesazhet ndër-role

  ## Siguria
  - RLS i aktivizuar në të gjitha tabelat
  - Politika bazë në rol
  - UNIQUE constraints për shmangur të dhëna dyfishe
*/

-- ═══════════════════════════════════════════════════════════════
-- TABELA
-- ═══════════════════════════════════════════════════════════════

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
  name text NOT NULL UNIQUE,
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, academic_year_id)
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text DEFAULT '' UNIQUE,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subject_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level integer NOT NULL CHECK (grade_level BETWEEN 1 AND 9),
  hours_per_week integer NOT NULL DEFAULT 2,
  UNIQUE(subject_id, grade_level)
);

CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS student_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

CREATE TABLE IF NOT EXISTS parent_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship text DEFAULT 'prind',
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  grade numeric(4,2) NOT NULL CHECK (grade BETWEEN 1 AND 5),
  assessment_type text NOT NULL DEFAULT 'vlersim'
    CHECK (assessment_type IN ('vlersim', 'perfundimtare_gjysmvjetor', 'perfundimtare_vjetor')),
  assessment_number integer CHECK (assessment_number IS NULL OR assessment_number BETWEEN 1 AND 4),
  description text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  semester integer DEFAULT 1 CHECK (semester IN (1, 2)),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id, class_id, semester, assessment_type, assessment_number),
  CONSTRAINT grades_assess_num_logic CHECK (
    (assessment_type = 'vlersim' AND assessment_number IS NOT NULL)
    OR (assessment_type IN ('perfundimtare_gjysmvjetor', 'perfundimtare_vjetor') AND assessment_number IS NULL)
  )
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id, date)
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
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_read_own"    ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_read_dir"    ON profiles FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "profiles_read_mesues" ON profiles FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'mesues' AND role IN ('nxenes', 'prind', 'mesues'));
CREATE POLICY "profiles_read_prind"  ON profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = profiles.id));
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_dir"  ON profiles FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_dir"  ON profiles FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "profiles_delete_dir"  ON profiles FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- academic_years
CREATE POLICY "ay_read"   ON academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "ay_insert" ON academic_years FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "ay_update" ON academic_years FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- classes
CREATE POLICY "classes_read"   ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_insert" ON classes FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "classes_update" ON classes FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "classes_delete" ON classes FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- subjects
CREATE POLICY "subjects_read"   ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_insert" ON subjects FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "subjects_update" ON subjects FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- subject_grades
CREATE POLICY "sg_read"   ON subject_grades FOR SELECT TO authenticated USING (true);
CREATE POLICY "sg_insert" ON subject_grades FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sg_update" ON subject_grades FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sg_delete" ON subject_grades FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- class_subjects
CREATE POLICY "cs_read"   ON class_subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "cs_insert" ON class_subjects FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "cs_update" ON class_subjects FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "cs_delete" ON class_subjects FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- student_classes
CREATE POLICY "sc_read_dir"     ON student_classes FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sc_read_mesues"  ON student_classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM class_subjects csx WHERE csx.class_id = student_classes.class_id AND csx.teacher_id = auth.uid()) OR EXISTS (SELECT 1 FROM classes c WHERE c.id = student_classes.class_id AND c.homeroom_teacher_id = auth.uid()));
CREATE POLICY "sc_read_nxenes"  ON student_classes FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "sc_read_prind"   ON student_classes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = student_classes.student_id));
CREATE POLICY "sc_insert"       ON student_classes FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sc_delete"       ON student_classes FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- parent_students
CREATE POLICY "ps_read_dir"    ON parent_students FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "ps_read_prind"  ON parent_students FOR SELECT TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "ps_read_nxenes" ON parent_students FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "ps_insert"      ON parent_students FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "ps_delete"      ON parent_students FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- grades
CREATE POLICY "grades_read_dir"    ON grades FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "grades_read_mesues" ON grades FOR SELECT TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "grades_read_nxenes" ON grades FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "grades_read_prind"  ON grades FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = grades.student_id));
CREATE POLICY "grades_insert"      ON grades FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid() AND EXISTS (SELECT 1 FROM class_subjects csx WHERE csx.class_id = grades.class_id AND csx.subject_id = grades.subject_id AND csx.teacher_id = auth.uid()));
CREATE POLICY "grades_update"      ON grades FOR UPDATE TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "grades_delete"      ON grades FOR DELETE TO authenticated USING (teacher_id = auth.uid());

-- attendance
CREATE POLICY "att_read_dir"    ON attendance FOR SELECT TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "att_read_mesues" ON attendance FOR SELECT TO authenticated USING (recorded_by = auth.uid());
CREATE POLICY "att_read_nxenes" ON attendance FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE POLICY "att_read_prind"  ON attendance FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM parent_students ps WHERE ps.parent_id = auth.uid() AND ps.student_id = attendance.student_id));
CREATE POLICY "att_insert"      ON attendance FOR INSERT TO authenticated WITH CHECK (recorded_by = auth.uid() AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'mesues');
CREATE POLICY "att_update"      ON attendance FOR UPDATE TO authenticated USING (recorded_by = auth.uid()) WITH CHECK (recorded_by = auth.uid());

-- announcements
CREATE POLICY "ann_read"   ON announcements FOR SELECT TO authenticated USING (target_role = 'te_gjithe' OR target_role = (SELECT role FROM profiles WHERE id = auth.uid()) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "ann_insert" ON announcements FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('drejtor', 'mesues'));
CREATE POLICY "ann_update" ON announcements FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "ann_delete" ON announcements FOR DELETE TO authenticated USING (author_id = auth.uid());

-- schedule
CREATE POLICY "sched_read"   ON schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "sched_insert" ON schedule FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sched_update" ON schedule FOR UPDATE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor') WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');
CREATE POLICY "sched_delete" ON schedule FOR DELETE TO authenticated USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'drejtor');

-- messages
CREATE POLICY "msg_read_recv"  ON messages FOR SELECT TO authenticated USING (auth.uid() = receiver_id);
CREATE POLICY "msg_read_send"  ON messages FOR SELECT TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "msg_insert"     ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "msg_update"     ON messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "msg_delete"     ON messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- ═══════════════════════════════════════════════════════════════
-- INDEKSE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_role           ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_classes_grade           ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_ay              ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_sc_student              ON student_classes(student_id);
CREATE INDEX IF NOT EXISTS idx_sc_class                ON student_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student          ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class            ON grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject          ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_date             ON grades(date);
CREATE INDEX IF NOT EXISTS idx_grades_semester         ON grades(semester, assessment_type, assessment_number);
CREATE INDEX IF NOT EXISTS idx_grades_student_semester ON grades(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_att_student             ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_att_date                ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_sched_class             ON schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_sched_day               ON schedule(day_of_week);
CREATE INDEX IF NOT EXISTS idx_ann_target              ON announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_ps_parent               ON parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_ps_student              ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_msg_receiver            ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender              ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_unread              ON messages(receiver_id, is_read) WHERE is_read = false;

-- ═══════════════════════════════════════════════════════════════
-- TË DHËNA FILLESTARE
-- ═══════════════════════════════════════════════════════════════

INSERT INTO academic_years (id, name, start_date, end_date, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001','2025-2026','2025-09-15','2026-06-15',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO subjects (id, name, code, description) VALUES
  ('b0000000-0000-0000-0000-000000000001','Matematike','MAT','Matematika dhe gjeometria'),
  ('b0000000-0000-0000-0000-000000000002','Gjuhe Shqipe','GJSH','Gjuha shqipe dhe letersia'),
  ('b0000000-0000-0000-0000-000000000003','Histori','HIS','Historia e Kosoves dhe botes'),
  ('b0000000-0000-0000-0000-000000000004','Gjeografi','GJE','Gjeografia fizike dhe humane'),
  ('b0000000-0000-0000-0000-000000000005','Biologji','BIO','Biologjia dhe shkencat natyrore'),
  ('b0000000-0000-0000-0000-000000000006','Fizike','FIZ','Fizika dhe eksperimentet'),
  ('b0000000-0000-0000-0000-000000000007','Kimi','KIM','Kimia dhe laboratori'),
  ('b0000000-0000-0000-0000-000000000008','Anglisht','ANG','Gjuha angleze'),
  ('b0000000-0000-0000-0000-000000000009','Edukim Fizik','EF','Edukimi fizik dhe sporti'),
  ('b0000000-0000-0000-0000-000000000010','Art Pamor','ART','Arti pamor dhe vizatimi'),
  ('b0000000-0000-0000-0000-000000000011','Muzike','MUZ','Edukimi muzikor'),
  ('b0000000-0000-0000-0000-000000000012','TIK','TIK','Teknologjia e informacionit'),
  ('b0000000-0000-0000-0000-000000000013','Natyra dhe Shoqeria','NSH','Natyra dhe shoqeria per klasa 1-3'),
  ('b0000000-0000-0000-0000-000000000014','Edukate Qytetare','EQ','Edukate qytetare dhe te drejtat'),
  ('b0000000-0000-0000-0000-000000000015','Gjermanisht','GJE2','Gjuha gjermane si gjuhe e dyte'),
  ('b0000000-0000-0000-0000-000000000016','Frëngjisht','FRA','Gjuha frenge'),
  ('b0000000-0000-0000-0000-000000000017','Shkencat e Natyres','SHN','Shkencat e natyres klasa 4-5'),
  ('b0000000-0000-0000-0000-000000000018','Fete dhe Kultura','FK','Fete dhe kultura')
ON CONFLICT (id) DO NOTHING;

INSERT INTO classes (id, name, grade_level, section, academic_year_id) VALUES
  ('c0000000-0000-0000-0000-000000000001','Klasa 1-A',1,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002','Klasa 1-B',1,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003','Klasa 2-A',2,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000004','Klasa 2-B',2,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000005','Klasa 3-A',3,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000006','Klasa 3-B',3,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000007','Klasa 4-A',4,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000008','Klasa 4-B',4,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000009','Klasa 5-A',5,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000010','Klasa 5-B',5,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000011','Klasa 6-A',6,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000012','Klasa 6-B',6,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000013','Klasa 7-A',7,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000014','Klasa 7-B',7,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000015','Klasa 8-A',8,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000016','Klasa 8-B',8,'B','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000017','Klasa 9-A',9,'A','a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000018','Klasa 9-B',9,'B','a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
