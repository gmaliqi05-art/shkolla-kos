/*
  # Revoke EXECUTE te trigger-funksioni set_school_id_from_creator

  Gjetur nga Supabase security advisor pas migrimit
  20260615130000_school_scope_councils_and_national_tests.sql:

  public.set_school_id_from_creator() është funksion TRIGGER me SECURITY DEFINER,
  por mbeti i thirrshëm si RPC nga anon/authenticated
  (/rest/v1/rpc/set_school_id_from_creator). Trigger-funksionet ekzekutohen
  pavarësisht nga grant-et EXECUTE, prandaj e heqim nga të gjithë rolet.
*/

REVOKE EXECUTE ON FUNCTION public.set_school_id_from_creator() FROM PUBLIC, anon, authenticated;
