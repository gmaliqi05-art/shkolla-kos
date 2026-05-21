-- Paketa 66: Shtim i kontrollit same-school për mesazhe
--
-- PROBLEM (gjetur nga audit hierarkik):
-- Para: çdo përdorues mund të dërgonte mesazh ÇDOKUJ (RLS kontrollonte
-- vetëm që sender_id = auth.uid()). Mësues nga shkolla A mund të dërgonte
-- mesazh nxënësi nga shkolla B.
--
-- ZGJIDHJA:
-- Funksion same_school_or_admin() me SECURITY DEFINER që kthen TRUE kur:
--  1. Sender dhe receiver janë në të njëjtën shkollë, OSE
--  2. Sender ose receiver është admin pa school (DKA, ministri, inspektor)
--
-- Update INSERT policy në messages që përdor funksionin.

CREATE OR REPLACE FUNCTION public.same_school_or_admin(receiver uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  WITH s AS (SELECT school_id FROM profiles WHERE id = auth.uid() LIMIT 1),
       r AS (SELECT school_id FROM profiles WHERE id = receiver LIMIT 1)
  SELECT
    ((SELECT school_id FROM s) IS NOT NULL AND (SELECT school_id FROM s) = (SELECT school_id FROM r))
    OR (SELECT school_id FROM s) IS NULL
    OR (SELECT school_id FROM r) IS NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.same_school_or_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.same_school_or_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "Users can send messages as themselves" ON messages;
CREATE POLICY "Users can send messages in same school" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.same_school_or_admin(receiver_id)
  );
