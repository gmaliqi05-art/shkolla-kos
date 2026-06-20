/*
  # P2 security hardening: lock down direct RPC to the licence trigger function

  The security advisor flagged several SECURITY DEFINER functions as callable
  via the REST RPC endpoint. Most of them — current_user_role(),
  current_user_school_id(), current_dka_municipality_id(), same_school_or_admin()
  — are intentionally executable by `authenticated`: they are referenced inside
  RLS policy expressions, which are evaluated with the querying user's
  privileges, so revoking EXECUTE would break row-level security across the app.
  anonymize_student() is invoked via RPC by the deletion-request workflow and
  already guards itself (drejtor/super_admin + same school).

  enforce_teacher_license() is different: it is purely a trigger function on
  class_subjects (UA 05/2017). It is never meant to be called directly, yet it
  is exposed via /rest/v1/rpc/enforce_teacher_license to anon and authenticated.
  Trigger execution does not depend on the caller's EXECUTE privilege, so we can
  safely revoke direct EXECUTE without affecting the trigger.
*/

REVOKE EXECUTE ON FUNCTION public.enforce_teacher_license() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_teacher_license() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_teacher_license() FROM public;
