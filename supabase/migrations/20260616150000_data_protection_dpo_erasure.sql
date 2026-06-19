/*
  # Mbrojtja e të dhënave: DPO + e drejta e harresës (Ligji 06/L-082)

  1. DPO: kontakti i Zyrtarit për Mbrojtjen e të Dhënave te school_info.
  2. Afati 30-ditor për kërkesat e fshirjes (deadline_at).
  3. Funksioni anonymize_student(): kur drejtori përfundon një kërkesë fshirjeje,
     anonimizon identitetin e nxënësit dhe heq të dhënat shëndetësore, por RUAN
     të dhënat me detyrim ligjor (nota, frekuentim, Amza) sipas afateve të ruajtjes.
     SECURITY DEFINER, i kufizuar te drejtori i shkollës ose super_admin.
*/

ALTER TABLE school_info ADD COLUMN IF NOT EXISTS dpo_name text DEFAULT '';
ALTER TABLE school_info ADD COLUMN IF NOT EXISTS dpo_email text DEFAULT '';

ALTER TABLE data_deletion_requests
  ADD COLUMN IF NOT EXISTS deadline_at timestamptz DEFAULT (now() + interval '30 days');

CREATE OR REPLACE FUNCTION public.anonymize_student(p_student uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  student_school uuid;
BEGIN
  caller_role := public.current_user_role();
  IF caller_role NOT IN ('drejtor', 'super_admin') THEN
    RAISE EXCEPTION 'Pa autorizim për anonimizim' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF caller_role = 'drejtor' THEN
    SELECT school_id INTO student_school FROM public.profiles WHERE id = p_student;
    IF student_school IS DISTINCT FROM public.current_user_school_id() THEN
      RAISE EXCEPTION 'Nxënësi nuk i përket shkollës suaj' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Anonimizo identitetin (ruaj rreshtin për integritet referencial të notave/Amzës)
  UPDATE public.profiles SET
    full_name = 'Nxënës i anonimizuar',
    email = 'anonymized+' || p_student::text || '@shkolla.invalid',
    phone = '',
    personal_number = NULL,
    date_of_birth = NULL,
    place_of_birth = '',
    address = '',
    nationality = '',
    legal_guardian_name = '',
    legal_guardian_relation = '',
    avatar_url = '',
    enrollment_status = 'larguar',
    deleted_at = now()
  WHERE id = p_student;

  -- Hiq të dhënat e ndjeshme shëndetësore (jo nën detyrim ruajtjeje)
  DELETE FROM public.student_health_records WHERE student_id = p_student;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.anonymize_student(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.anonymize_student(uuid) TO authenticated;
