/*
  # Mbrojtja e të dhënave të ndjeshme shëndetësore (Ligji 06/L-082)

  PROBLEMI (gjetur nga auditi, verifikuar te baza):
  Të dhënat mjekësore/emergjente ruheshin si kolona te `profiles`, ndërsa
  politika "Teachers can read relevant profiles" lejonte çdo mësues të lexonte
  çdo profil nxënësi/prindi pa kufizim shkolle dhe pa kufizim kolone — pra edhe
  `medical_conditions`, `family_doctor`, kontaktet emergjente. Kjo shkel
  minimizimin e të dhënave për të mitur.

  ZGJIDHJA:
  1. Tabelë e veçantë `student_health_records` me RLS rigoroze: vetëm
     drejtori/pedagogu i SHKOLLËS së nxënësit menaxhojnë; prindi & nxënësi
     lexojnë të vetët; mësuesit S'KANË qasje.
  2. Zhvendos të dhënat ekzistuese dhe hiq kolonat nga `profiles`.
  3. Forco politikën e leximit të mësuesit te `profiles` me kufizim same-school
     (të gjitha rrjedhat e krijimit vendosin school_id).
*/

CREATE TABLE IF NOT EXISTS student_health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  emergency_contact_name text DEFAULT '',
  emergency_contact_phone text DEFAULT '',
  emergency_contact_relation text DEFAULT '',
  medical_conditions text DEFAULT '',
  family_doctor text DEFAULT '',
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Zhvendos të dhënat ekzistuese (idempotent)
INSERT INTO student_health_records
  (student_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_conditions, family_doctor)
SELECT p.id,
  COALESCE(p.emergency_contact_name, ''), COALESCE(p.emergency_contact_phone, ''),
  COALESCE(p.emergency_contact_relation, ''), COALESCE(p.medical_conditions, ''),
  COALESCE(p.family_doctor, '')
FROM profiles p
WHERE p.role = 'nxenes'
  AND COALESCE(p.emergency_contact_name,'') || COALESCE(p.emergency_contact_phone,'')
   || COALESCE(p.medical_conditions,'') || COALESCE(p.family_doctor,'') <> ''
ON CONFLICT (student_id) DO NOTHING;

-- Hiq kolonat e ndjeshme nga profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS emergency_contact_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS emergency_contact_phone;
ALTER TABLE profiles DROP COLUMN IF EXISTS emergency_contact_relation;
ALTER TABLE profiles DROP COLUMN IF EXISTS medical_conditions;
ALTER TABLE profiles DROP COLUMN IF EXISTS family_doctor;

ALTER TABLE student_health_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Health managed by school staff" ON student_health_records;
CREATE POLICY "Health managed by school staff" ON student_health_records
  FOR ALL TO authenticated
  USING (
    public.current_user_role() IN ('drejtor', 'pedagog')
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = student_health_records.student_id AND p.school_id = public.current_user_school_id()
    )
  )
  WITH CHECK (
    public.current_user_role() IN ('drejtor', 'pedagog')
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = student_health_records.student_id AND p.school_id = public.current_user_school_id()
    )
  );

DROP POLICY IF EXISTS "Student reads own health" ON student_health_records;
CREATE POLICY "Student reads own health" ON student_health_records
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Parent reads child health" ON student_health_records;
CREATE POLICY "Parent reads child health" ON student_health_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.student_id = student_health_records.student_id AND ps.parent_id = auth.uid()
    )
  );

-- Forco leximin e mësuesit te profiles: vetëm e njëjta shkollë
DROP POLICY IF EXISTS "Teachers can read relevant profiles" ON profiles;
CREATE POLICY "Teachers can read relevant profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'mesues'
    AND role = ANY (ARRAY['nxenes', 'prind', 'mesues'])
    AND school_id = public.current_user_school_id()
  );
