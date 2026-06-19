/*
  # Zbatim i licencës së mësuesit te caktimi i lëndëve (UA 05/2017)

  Gjetur nga auditi: sistemi ruan fushat e licencës (license_number,
  license_expires_at, ...) por NUK e pengonte caktimin e një mësuesi me
  licencë të skaduar te një lëndë/klasë.

  Ky trigger bllokon INSERT/UPDATE te class_subjects kur mësuesi i caktuar
  ka licencë QARTËSISHT të skaduar (license_expires_at < sot). NUK bllokon
  kur mungojnë të dhënat e licencës (që të mos prishen rrjedhat me të dhëna
  të paplotësuara gjatë fazës fillestare).
*/

CREATE OR REPLACE FUNCTION public.enforce_teacher_license()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exp date;
BEGIN
  SELECT license_expires_at INTO exp FROM public.profiles WHERE id = NEW.teacher_id;
  IF exp IS NOT NULL AND exp < CURRENT_DATE THEN
    RAISE EXCEPTION 'Mësuesi ka licencë të skaduar (UA 05/2017) më %; nuk mund të caktohet në lëndë.', exp
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_teacher_license ON class_subjects;
CREATE TRIGGER trg_enforce_teacher_license
  BEFORE INSERT OR UPDATE OF teacher_id ON class_subjects
  FOR EACH ROW
  WHEN (NEW.teacher_id IS NOT NULL)
  EXECUTE FUNCTION public.enforce_teacher_license();
