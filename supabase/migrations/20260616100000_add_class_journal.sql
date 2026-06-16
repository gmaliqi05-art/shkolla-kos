/*
  # Ditari i Klasës (class_journal) — paritet repo ↔ bazë

  Kjo tabelë EKZISTON në bazën live por migrimi i saj kishte humbur nga repo
  (drift). Skedari e rikrijon saktësisht skemën e bazës që një deploy i ri
  (p.sh. nga repo) ta ndërtojë Ditarin e Klasës — përndryshe paqja
  src/pages/teacher/ClassDiary.tsx që pyet `class_journal` do të dështonte.

  UA 19/2018 — Dokumentacioni Pedagogjik: regjistrim ditor i orëve, lëndës,
  temës dhe detyrave.

  SHËNIM: politika e leximit (cj_read_all = USING(true)) është riprodhuar
  ashtu siç është në bazë; auditi ligjor e shënon si pikë për kufizim
  sipas shkollës në një fazë të dytë.
*/

CREATE TABLE IF NOT EXISTS class_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  lesson_number integer CHECK (lesson_number >= 1 AND lesson_number <= 8),
  topic text NOT NULL,
  homework text DEFAULT ''::text,
  notes text DEFAULT ''::text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (class_id, subject_id, date, lesson_number)
);

ALTER TABLE class_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cj_read_all" ON class_journal;
CREATE POLICY "cj_read_all" ON class_journal
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "cj_insert_teacher" ON class_journal;
CREATE POLICY "cj_insert_teacher" ON class_journal
  FOR INSERT TO authenticated
  WITH CHECK (
    teacher_id = auth.uid()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = ANY (ARRAY['mesues', 'drejtor'])
  );

DROP POLICY IF EXISTS "cj_update_owner" ON class_journal;
CREATE POLICY "cj_update_owner" ON class_journal
  FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "cj_delete_owner" ON class_journal;
CREATE POLICY "cj_delete_owner" ON class_journal
  FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());
