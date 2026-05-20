-- Paketa 62: Auto-create profile on signup
--
-- PROBLEMI: Pas supabase.auth.signUp(), sesioni ndërron te përdoruesi i ri.
-- Kur frontend-i provon të bëjë INSERT në profiles, RLS bllokon sepse
-- current_user_role() ende kthen NULL (profili s'ekziston ende).
-- Përdoruesi merr error "new row violates row-level security policy".
--
-- ZGJIDHJA: Trigger me SECURITY DEFINER që krijon profilin AUTOMATIKISHT
-- nga raw_user_meta_data e auth.users. Frontend-i pason metadata te
-- options.data te signUp, dhe trigger-i e bën pjesën tjetër me bypass-RLS.
--
-- Përdorim:
--   await supabase.auth.signUp({
--     email, password,
--     options: { data: { full_name, role, school_id, ... } }
--   });
-- Profili krijohet automatikisht.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    school_id,
    managed_municipality_id,
    must_change_password
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'nxenes'),
    (NEW.raw_user_meta_data->>'school_id')::uuid,
    (NEW.raw_user_meta_data->>'managed_municipality_id')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
