-- Paketa 65: REVOKE EXECUTE për handle_new_user nga roles të jashtëm
--
-- Linter Supabase zbuloi që funksioni handle_new_user (SECURITY DEFINER,
-- shtuar në Paketa 62) ishte thirrshme nga anon/authenticated përmes
-- /rest/v1/rpc/handle_new_user. Kjo do lejonte kushdo të krijonte
-- profile arbitrar.
--
-- Trigger akoma funksionon sepse:
-- 1. Trigger-i është invokuar nga sistem (jo nga RPC)
-- 2. Funksioni ekzekutohet me privilegjet e pronarit (postgres) sepse
--    është SECURITY DEFINER
-- 3. EXECUTE është vetëm për thirrje direkte përmes RPC, jo për trigger

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
