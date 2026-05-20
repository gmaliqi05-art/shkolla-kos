-- Paketa 41: Lexim publik për tabelat e referencës
--
-- Konteksti: Modaliteti demo nuk autentikohet në Supabase, kështu që
-- përdoruesit demo nuk mund të shohin komunat, fshatrat dhe shkollat
-- e mbjella. RLS politikat e mëparshme kërkonin role 'authenticated'.
--
-- Zgjidhja: Komunat, fshatrat dhe shkollat janë të dhëna PUBLIKE zyrtare
-- të Republikës së Kosovës (Ligji 03/L-068 për Arsimin në Komunat).
-- Nuk ka arsye sigurie që këto të mos lexohen nga përdoruesit anonim.

DROP POLICY IF EXISTS "Public read municipalities" ON municipalities;
CREATE POLICY "Public read municipalities" ON municipalities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read localities" ON localities;
CREATE POLICY "Public read localities" ON localities
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read school_info" ON school_info;
CREATE POLICY "Public read school_info" ON school_info
  FOR SELECT TO anon, authenticated USING (true);
