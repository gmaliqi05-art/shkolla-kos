-- Paketa 52: Heqje e qasjes anon për funksionet SECURITY DEFINER
--
-- Problemi: current_user_role() dhe current_dka_municipality_id() janë
-- SECURITY DEFINER (bypass RLS), dhe anon role kishte EXECUTE.
-- Anon mund t'i thirrte direkt përmes PostgREST për informacion sigurie.
-- Megjithëse nuk leakon të dhëna në praktikë (auth.uid() = NULL për anon),
-- best practice është revoke explicit.

REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_dka_municipality_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_book_copies() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_dka_municipality_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_book_copies() TO authenticated;

-- Fix search_path (Supabase linter warning për mutable search_path)
ALTER FUNCTION public.update_book_copies() SET search_path = public;
