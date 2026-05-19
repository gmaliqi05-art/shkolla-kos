/*
  # Paketa 2: Privatësia & Siguria (Ligji 06/L-082)

  Përputhshmëri me:
  - Ligji 06/L-082 për Mbrojtjen e të Dhënave Personale
  - Ligji 04/L-032, neni për mbrojtjen e të dhënave të nxënësve
  - Parime GDPR të huazuara (në fuqi në Kosovë përmes ligjit 06/L-082)

  Çfarë shton:
  1. audit_logs — gjurmë e plotë e qasjes në të dhënat e ndjeshme
  2. consents — pëlqimet e dhëna nga prindi/kujdestari
  3. data_deletion_requests — kërkesat për fshirjen e të dhënave
  4. profiles.must_change_password — detyrimi për ndryshim fjalëkalimi në hyrjen e parë
  5. profiles.deleted_at — soft-delete për të ruajtur historikun ligjor
  6. profiles.last_login_at — gjurmim i hyrjeve

  Siguria: RLS i strikt — vetëm drejtori sheh audit logs; prindi sheh
  kërkesat e veta; nxënësi/prindi sheh pëlqimet e veta.
*/

-- =============================================================================
-- 1) AUDIT_LOGS — gjurmim i qasjeve në të dhëna të ndjeshme
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role text,
  action text NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete', 'export', 'login', 'logout', 'password_change')),
  resource_type text NOT NULL,
  resource_id uuid,
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Vetëm drejtori sheh audit logs
DROP POLICY IF EXISTS "Only director reads audit_logs" ON audit_logs;
CREATE POLICY "Only director reads audit_logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Çdokush i autentifikuar mund të krijojë audit log për veten (klienti i log-on veprimet e veta)
DROP POLICY IF EXISTS "Auth users insert own audit_logs" ON audit_logs;
CREATE POLICY "Auth users insert own audit_logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- Askush nuk mund të modifikojë ose fshijë audit logs (immutability)
-- (Mungesa e politikave UPDATE/DELETE i bllokon ato by default kur RLS është aktiv)

-- =============================================================================
-- 2) CONSENTS — pëlqimet e prindit/kujdestarit
-- =============================================================================

CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  consent_type text NOT NULL CHECK (consent_type IN (
    'data_processing',     -- përpunimi i të dhënave personale
    'photo_use',           -- përdorimi i fotove
    'directory',           -- përfshirja në direktori shkollore
    'medical',             -- ndarja e informacioneve mjekësore
    'communication',       -- komunikim me palë të treta
    'extracurricular'      -- aktivitete jashtëmësimore
  )),
  granted boolean NOT NULL DEFAULT false,
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  notes text DEFAULT '',
  UNIQUE (student_id, consent_type)
);

CREATE INDEX IF NOT EXISTS consents_student_idx ON consents(student_id);
CREATE INDEX IF NOT EXISTS consents_granted_by_idx ON consents(granted_by);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Drejtori sheh dhe menaxhon gjithçka
DROP POLICY IF EXISTS "Director full access on consents" ON consents;
CREATE POLICY "Director full access on consents"
  ON consents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Prindi shton/sheh/modifikon pëlqimet për fëmijët e vet
DROP POLICY IF EXISTS "Parents manage own children consents" ON consents;
CREATE POLICY "Parents manage own children consents"
  ON consents FOR ALL TO authenticated
  USING (
    granted_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = consents.student_id
        AND parent_students.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    granted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM parent_students
      WHERE parent_students.student_id = consents.student_id
        AND parent_students.parent_id = auth.uid()
    )
  );

-- Nxënësi sheh pëlqimet e veta (read-only)
DROP POLICY IF EXISTS "Students read own consents" ON consents;
CREATE POLICY "Students read own consents"
  ON consents FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Mësuesi sheh pëlqimet e nxënësve të klasës së vet (vetëm leximi)
DROP POLICY IF EXISTS "Teachers read class consents" ON consents;
CREATE POLICY "Teachers read class consents"
  ON consents FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN class_subjects cs ON cs.class_id = sc.class_id
      WHERE sc.student_id = consents.student_id
        AND cs.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM student_classes sc
      JOIN classes c ON c.id = sc.class_id
      WHERE sc.student_id = consents.student_id
        AND c.homeroom_teacher_id = auth.uid()
    )
  );

-- =============================================================================
-- 3) DATA_DELETION_REQUESTS — kërkesat për fshirjen e të dhënave (E drejta e harresës)
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text DEFAULT '',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS deletion_requests_student_idx ON data_deletion_requests(student_id);
CREATE INDEX IF NOT EXISTS deletion_requests_status_idx ON data_deletion_requests(status);

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Drejtori sheh të gjitha kërkesat dhe i shqyrton
DROP POLICY IF EXISTS "Director full access on deletion_requests" ON data_deletion_requests;
CREATE POLICY "Director full access on deletion_requests"
  ON data_deletion_requests FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'drejtor'));

-- Prindi/nxënësi krijon kërkesë për veten ose fëmijën
DROP POLICY IF EXISTS "Users create own deletion_requests" ON data_deletion_requests;
CREATE POLICY "Users create own deletion_requests"
  ON data_deletion_requests FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND (
      student_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM parent_students
        WHERE parent_students.student_id = data_deletion_requests.student_id
          AND parent_students.parent_id = auth.uid()
      )
    )
  );

-- Prindi/nxënësi sheh kërkesat e veta
DROP POLICY IF EXISTS "Users read own deletion_requests" ON data_deletion_requests;
CREATE POLICY "Users read own deletion_requests"
  ON data_deletion_requests FOR SELECT TO authenticated
  USING (
    requested_by = auth.uid()
    OR student_id = auth.uid()
  );

-- =============================================================================
-- 4) PROFILES — fusha të reja për sigurinë
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz;

CREATE INDEX IF NOT EXISTS profiles_deleted_at_idx ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;
