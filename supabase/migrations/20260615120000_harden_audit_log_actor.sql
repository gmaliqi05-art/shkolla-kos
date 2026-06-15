/*
  # Forcim i audit_logs: aktori i pacaktuar nuk lejohet

  Përputhshmëri me Ligjin 06/L-082 për Mbrojtjen e të Dhënave Personale
  (gjurmë e pamohueshme / accountability).

  Problemi:
  Politika ekzistuese e INSERT-it te audit_logs (shtuar në
  20260519181000_add_privacy_and_security.sql) lejonte:

      WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL)

  Klauzola `OR actor_id IS NULL` lejon çdo përdorues të autentikuar të
  fusë regjistra audit pa autor (actor_id = NULL), duke mundësuar
  maskimin e kujt e kreu veprimin dhe duke prishur gjurmën e auditit.

  Klienti (src/lib/audit.ts) NUK fut kurrë regjistra me actor NULL —
  `logAudit` kthehet herët kur `actorId` mungon — prandaj heqja e
  klauzolës NULL nuk prish asnjë rrjedhë legjitime.

  Rregullimi:
  Kërko gjithmonë `actor_id = auth.uid()`. Politikat UPDATE/DELETE
  mbeten të munguara (audit_logs janë të pandryshueshme by default).
*/

DROP POLICY IF EXISTS "Auth users insert own audit_logs" ON audit_logs;
CREATE POLICY "Auth users insert own audit_logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
