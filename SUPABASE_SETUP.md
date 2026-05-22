# Konfigurimi i Supabase për Shkolla-Kos

## Probleme të njohura në krijimin e llogarive (login)

### Simptoma
- Drejtori krijon një mësues të ri, por mësuesi nuk mund të identifikohet
- DKA krijohet nga Ministria, por nuk mund të bëjë login
- Inspektori krijohet me sukses, por mesazhi "Email not confirmed" shfaqet

### Shkaku
Frontend përdor `supabase.auth.signUp()` për të krijuar llogari të reja. Kjo metodë:

1. **Krijon `auth.users` me `email_confirmed_at = NULL`** (nëse "Confirm email" është ON)
2. **Dërgon email konfirmimi** te user-i i porsa-krijuar
3. **Ndërron sesionin** te user-i i ri (logout administratorin)

### Zgjidhjet

#### Zgjidhja A (E rekomanduar) — Çaktivizo email confirmation

Te Supabase Dashboard:
1. Hyr te projekti
2. Authentication → Email
3. Çaktivizo "Confirm email"
4. Ruaj

Pas kësaj, kredencialet që shfaqen pas krijimit funksionojnë menjëherë për login.

#### Zgjidhja B — Edge Function me service_role (e komplikuar)

Krijo një Supabase Edge Function që përdor `service_role` key:

```typescript
// supabase/functions/admin-create-user/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { email, password, metadata } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { data, error } = await supabase.auth.admin.createUser({
    email, password,
    email_confirm: true,  // Konfirmon email-in automatikisht
    user_metadata: metadata,
  });
  return new Response(JSON.stringify({ data, error }));
});
```

Pastaj frontend thërret këtë funksion në vend të `supabase.auth.signUp()`.

**Përparësitë e B**:
- Nuk ndërron sesionin e administratorit
- Email confirmation mund të jetë ON për self-registration

**Disavantazhet e B**:
- Kërkon deployment të Edge Function
- Më shumë kod për të mirëmbajtur

## Arkitektura e Auth-it

```
┌────────────────────┐
│  Frontend (React)  │
│                    │
│  supabase.auth.    │ → 1. signUp(email, password, metadata)
│  signUp()          │
└──────┬─────────────┘
       │
       ↓
┌──────────────────────┐
│  Supabase Auth       │ → 2. Krijon auth.users
│  (managed)           │ → 3. Dërgon email konfirmimi (opcional)
└──────┬───────────────┘
       │
       ↓ (TRIGGER: on_auth_user_created)
┌──────────────────────────────┐
│  handle_new_user() trigger   │
│  (SECURITY DEFINER)          │ → 4. Krijon public.profiles me bypass RLS
│  Migration: 20260520090000   │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────┐
│  RLS Policies        │ → 5. current_user_role() funksion ndihmës
│  (SECURITY DEFINER)  │     evitues "EXISTS FROM profiles" recursion
└──────────────────────┘
```

### Roli i çdo komponenti

- **`auth.users`** — Supabase Auth (i menaxhuar). Nuk mund të bëjmë INSERT direkt këtu.
- **`public.profiles`** — Tabela jonë me të dhënat e profilit. Lidhet me `auth.users.id`.
- **`handle_new_user()`** — Trigger me SECURITY DEFINER që bypass-on RLS për të krijuar profilin automatikisht pas `auth.users INSERT`.
- **`current_user_role()`** — Funksion ndihmës SECURITY DEFINER që kthen rolin nga `profiles`, pa shkaktuar recursion në RLS policies.

## Lista e migracioneve relevante

| Migracioni | Përshkrimi |
|------------|------------|
| `20260514000000_consolidated_schema.sql` | Schema fillestare e profiles, classes, etj. |
| `20260520050000_fix_rls_recursion.sql` | Krijon `current_user_role()` për të shmangur recursion |
| `20260520090000_auto_create_profile_on_signup.sql` | Trigger `handle_new_user` |
| `20260520110000_revoke_handle_new_user.sql` | REVOKE për anon/authenticated |
| `20260521120000_expand_role_enums.sql` | Zgjeron CHECK constraint në 9 role |

## Verifikim i konfigurimit (checklist)

- [ ] Supabase Dashboard → Auth → Email → "Confirm email" është OFF
- [ ] Migration `20260521120000_expand_role_enums.sql` aplikuar (lejon 9 role)
- [ ] Trigger `on_auth_user_created` ekziston dhe është aktiv
- [ ] Funksioni `current_user_role()` ekziston
- [ ] RLS aktivizuar te të gjitha 56 tabelat

Kontrollo me SQL:
```sql
-- Verifikim i trigger
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';

-- Verifikim i funksionit
SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'current_user_role');

-- Verifikim i CHECK constraint
SELECT con.consrc FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles' AND con.conname = 'profiles_role_check';
```
