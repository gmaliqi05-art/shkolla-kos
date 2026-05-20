-- Paketa 42: Rregullim i recursion-it RLS te profiles dhe tabelat referencë
--
-- PROBLEMI: Politikat RLS te `profiles` (dhe tabelat e tjera që pyesin profiles)
-- përdornin `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'X')`.
-- Kjo krijonte rreth recursive:
--   SELECT FROM municipalities → policy bën EXISTS FROM profiles →
--   triggers RLS te profiles → policy DKA bën IN (SELECT FROM school_info) →
--   triggers RLS te school_info → policy DKA bën EXISTS FROM profiles → ...
-- Postgres e detekton si infinite recursion (ERROR 42P17).
--
-- ZGJIDHJA: Krijoj funksione SECURITY DEFINER që kthejnë rolin/managed_municipality
-- pa kaluar nga RLS. Pastaj rishkruaj politikat e tabelave kritike.

-- ========== Funksionet helper ==========

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_dka_municipality_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT managed_municipality_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM public;
REVOKE EXECUTE ON FUNCTION public.current_dka_municipality_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_dka_municipality_id() TO authenticated;

-- ========== profiles ==========

DROP POLICY IF EXISTS "Directors can read all profiles" ON profiles;
CREATE POLICY "Directors can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'drejtor');

DROP POLICY IF EXISTS "Directors can update all profiles" ON profiles;
CREATE POLICY "Directors can update all profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'drejtor');

DROP POLICY IF EXISTS "Directors can delete profiles" ON profiles;
CREATE POLICY "Directors can delete profiles" ON profiles
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'drejtor');

DROP POLICY IF EXISTS "Directors can insert new profiles" ON profiles;
CREATE POLICY "Directors can insert new profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'drejtor');

DROP POLICY IF EXISTS "Ministri reads all profiles" ON profiles;
CREATE POLICY "Ministri reads all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'ministri');

DROP POLICY IF EXISTS "Ministri manages profiles" ON profiles;
CREATE POLICY "Ministri manages profiles" ON profiles
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'ministri')
  WITH CHECK (public.current_user_role() = 'ministri');

DROP POLICY IF EXISTS "Teachers can read relevant profiles" ON profiles;
CREATE POLICY "Teachers can read relevant profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'mesues'
    AND role = ANY (ARRAY['nxenes'::text, 'prind'::text, 'mesues'::text])
  );

DROP POLICY IF EXISTS "DKA reads municipality profiles" ON profiles;
CREATE POLICY "DKA reads municipality profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.current_user_role() = 'drejtor_komunal'
    AND (
      profiles.id = auth.uid()
      OR profiles.school_id IN (
        SELECT id FROM school_info
        WHERE municipality_id = public.current_dka_municipality_id()
      )
    )
  );

DROP POLICY IF EXISTS "DKA manages own municipality profiles" ON profiles;
CREATE POLICY "DKA manages own municipality profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'drejtor_komunal');

-- ========== school_info ==========

DROP POLICY IF EXISTS "Director manages school_info" ON school_info;
CREATE POLICY "Director manages school_info" ON school_info
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'drejtor')
  WITH CHECK (public.current_user_role() = 'drejtor');

DROP POLICY IF EXISTS "Ministri manages school_info" ON school_info;
CREATE POLICY "Ministri manages school_info" ON school_info
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'ministri')
  WITH CHECK (public.current_user_role() = 'ministri');

DROP POLICY IF EXISTS "DKA manages own municipality schools" ON school_info;
CREATE POLICY "DKA manages own municipality schools" ON school_info
  FOR ALL TO authenticated
  USING (
    public.current_user_role() = 'drejtor_komunal'
    AND school_info.municipality_id = public.current_dka_municipality_id()
  )
  WITH CHECK (
    public.current_user_role() = 'drejtor_komunal'
    AND school_info.municipality_id = public.current_dka_municipality_id()
  );

-- ========== municipalities ==========

DROP POLICY IF EXISTS "Director manages municipalities" ON municipalities;
CREATE POLICY "Director manages municipalities" ON municipalities
  FOR ALL TO authenticated
  USING (public.current_user_role() = 'drejtor')
  WITH CHECK (public.current_user_role() = 'drejtor');

-- ========== localities ==========

DROP POLICY IF EXISTS "Director and DKA and Ministry manage localities" ON localities;
CREATE POLICY "Director and DKA and Ministry manage localities" ON localities
  FOR ALL TO authenticated
  USING (public.current_user_role() = ANY (ARRAY['drejtor'::text, 'drejtor_komunal'::text, 'ministri'::text]))
  WITH CHECK (public.current_user_role() = ANY (ARRAY['drejtor'::text, 'drejtor_komunal'::text, 'ministri'::text]));
