# CLAUDE.md

Guidance for AI assistants (Claude Code et al.) working on the Shkolla-Kos repository.

## Project overview

Shkolla-Kos is a school management system for Kosovo's pre-university education (Klasa 1-9 — grades 1-9). The UI is in Albanian (with Serbian, Turkish, and Bosnian translations). The system is designed around Kosovo's education laws (Ligji 04/L-032, 03/L-068) and is intended for use by public schools, municipal education directorates (DKA), the Education Inspectorate, and MAShTI (the Ministry).

The app supports **9 user roles**:

- `drejtor` — school director
- `mesues` — teacher
- `nxenes` — student
- `prind` — parent
- `pedagog` — school pedagogue / psychologist
- `drejtor_komunal` — DKA (municipal education director)
- `inspektor` — education inspector
- `ministri` — MAShTI (Ministry) user
- `super_admin` — system administrator

Each role has its own dashboard, sidebar navigation, and routes (see `src/App.tsx`).

## Tech stack

Versions are taken from `package.json`:

- React 18.3 + TypeScript 5.5 + Vite 5.4
- React Router v7.13 (`react-router-dom`)
- Supabase JS 2.57 (`@supabase/supabase-js`) — Postgres + Auth + Storage + Realtime
- Tailwind CSS 3.4
- Recharts 3.8 for charts
- Lucide React 0.344 for icons
- Vitest 4.1 + Testing Library + jsdom for tests
- ESLint 9 with `typescript-eslint` and `eslint-plugin-react-hooks`
- Node.js 20+ required (per README)

## Common commands

From `package.json`:

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # Production build to dist/
npm run preview      # Preview the production build
npm run lint         # ESLint over the repo
npm run typecheck    # tsc --noEmit -p tsconfig.app.json
npm test             # vitest run (single pass)
npm run test:watch   # vitest watch mode
npm run test:ui      # vitest UI
```

CI (`.github/workflows/ci.yml`) runs `npx tsc --noEmit`, `npx eslint src --quiet`, and `npm run build` on every push and PR against `main`. Match these locally before pushing.

## Project structure

Top-level `src/` (see `src/App.tsx` for how everything is wired):

```
src/
├── App.tsx              # Router; role-gated route trees, lazy-loaded pages
├── main.tsx             # React entry; also registers /sw.js for PWA
├── index.css            # Tailwind entry
├── components/          # Shared UI: FileUpload, LanguageSwitcher,
│                        # SearchableSelect, Skeleton, StatCard, ToastProvider
│   └── layout/          # DashboardLayout, Sidebar, NavItem type
├── contexts/
│   └── AuthContext.tsx  # Auth provider; exposes useAuth() -> { profile, loading, ... }
├── lib/
│   ├── supabase.ts      # Supabase client (uses VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   ├── audit.ts         # Helpers for writing to audit_log
│   ├── csvExport.ts     # Generic CSV export utility (has tests)
│   ├── formatDate.ts    # Locale-aware date formatting (has tests)
│   ├── utils.ts         # Misc helpers
│   └── i18n/            # I18nProvider + translation tables (sq, sr, tr, bs)
├── pages/
│   ├── LoginPage.tsx
│   ├── NotFoundPage.tsx
│   ├── TwoFactorSettings.tsx
│   ├── director/        # ~27 routes: ManageTeachers, ManageStudents, Reports,
│   │                    # ReportCards, SchoolCouncils, NationalTests, AuditLogs, ...
│   ├── teacher/         # ~20 routes: MyClasses, GradeEntry, AttendancePage,
│   │                    # BehaviorPage, ClassDiary, HomeworkPage, DiagnosticAssessments
│   ├── student/         # MyGrades, MySchedule, MyAttendance, SelfAssessment
│   ├── parent/          # ChildGrades, ChildAttendance, ChildIEP, PrivacySettings
│   ├── pedagog/         # PedagogDashboard (most pages reused from shared/teacher)
│   ├── dka/             # DkaDashboard
│   ├── inspektor/       # InspectorDashboard, InspectionsManagement, InspectionDetail
│   ├── ministri/        # MinistriDashboard, StaffAccountsManagement
│   ├── admin/           # SuperAdminDashboard
│   └── shared/          # MessagesPage, ProfileSettings, Portfolio, MyCouncils,
│                        # SchoolsManagement, LocalitiesManagement, LegalDocuments,
│                        # PrivacyPolicy, MyTestResults
├── types/
│   └── database.ts      # Hand-maintained DB types
└── test/
    └── setup.ts         # Vitest setup (Testing Library matchers)
```

Backend lives under `supabase/migrations/` (43 SQL files; see below).

## Internationalisation (i18n)

Four supported languages: `sq` (Albanian, default), `sr` (Serbian), `tr` (Turkish), `bs` (Bosnian) — mandated by Ligji 02/L-37 për Përdorimin e Gjuhëve.

- Implementation: `src/lib/i18n/I18nProvider.tsx` provides a context with the current language and a `t(key)` lookup. `LanguageSwitcher` in `src/components/` exposes the UI control.
- Nav items use a `labelKey` field (`nav.dashboard`, `nav.teachers`, ...). The raw `label` is the Albanian fallback shown when no translation key is registered. When adding nav items, supply both.
- Persist user language preference via the migration added in `20260519188000_add_language_preference.sql` (column on `profiles`).

## Routing and auth

Routing is centralised in `src/App.tsx`. The flow:

1. `App` mounts `BrowserRouter -> I18nProvider -> ToastProvider -> AuthProvider -> AppRoutes`.
2. `AppRoutes` reads `{ profile, loading }` from `useAuth()`.
3. If `loading` → spinner. If `profile === null` → only `/privacy-policy`, `/dokumentet-ligjore`, and `LoginPage` (`*`) are reachable.
4. Once authenticated, the entire route tree branches on `profile.role`. Each role gets its own `<Routes>` block wrapped in `<DashboardLayout navItems={...} role={...} />`, and a catch-all redirect to that role's landing page.

Route prefixes per role: `/drejtor`, `/mesues`, `/nxenes`, `/prind`, `/pedagog`, `/dka`, `/inspektor`, `/ministri`, `/admin`. URL slugs are Albanian (e.g. `/drejtor/nxenes`, `/mesues/frekuentimi`).

All page components are `React.lazy(...)` imports; the top-level `<Suspense fallback={<PageLoader />}>` provides the spinner. Keep this pattern when adding new pages.

`AuthContext` (in `src/contexts/AuthContext.tsx`) is the single source of truth for the current user. It exposes `profile` (the row from `public.profiles`, including `role` and `school_id`), `loading`, and the sign-in / sign-out helpers. Anywhere outside the router that needs the current user should call `useAuth()` rather than re-querying Supabase. New role checks should compare against `profile.role` using the string literals listed in **Project overview** above.

Sidebar navigation is configured per role as `NavItem[]` constants near the top of `App.tsx` (`directorNav`, `teacherNav`, `studentNav`, `parentNav`, `dkaNav`, `ministriNav`, `inspektorNav`, `pedagogNav`, `adminNav`). Add a new page by appending to the relevant nav array **and** registering its `<Route>` in the matching role block.

## Domain and roles

Real-world users:

- **Drejtor (school director):** manages teachers, students, parents, classes, councils, report cards (Dëftesat), discipline, NVA/PIA (special needs / individualised education plans), inspections received, etc.
- **Mësues (teacher):** classes, grade entry, attendance, behaviour, discipline, class diary (Ditari), homework, accommodations, parent meetings.
- **Nxënës (student):** own grades, schedule, attendance, messages, portfolio, self-assessment, national test results.
- **Prind (parent):** child's grades/attendance, IEP, parent meetings, privacy settings (consent management).
- **Pedagog:** NVA/PIA, diagnostic assessments, portfolio, councils.
- **Drejtor Komunal / DKA:** schools and localities in their municipality.
- **Inspektor:** schools and inspections (workflow: schedule → findings → recommendations).
- **Ministri (MAShTI):** national-level oversight, staff accounts, audit log.
- **Super admin:** content, policies, logs, backups, migrations, settings.

Reference tables include 38 komuna (municipalities), 162 vendbanime (localities), and 102 Kosovo schools (seeded via migrations like `20260520030000_seed_kosovo_schools.sql`).

## Supabase / backend

- Migrations: `supabase/migrations/*.sql`, 43 files at time of writing. Filenames are timestamped (`YYYYMMDDHHMMSS_*.sql`). Apply via Supabase CLI or dashboard.
- Foundational schema: `20260207062324_create_school_management_schema.sql` plus the seed `20260207062400_seed_base_data.sql`, and the later squash `20260514000000_consolidated_schema.sql`.
- Domain-specific later migrations (May 2026 series) layer in:
  - Assessment scale fixes: `20260207063912_update_to_kosovo_grading_system.sql`, `20260207072159_update_grades_kosovo_assessment_system.sql` — establish the 1-5 Kosovo scale.
  - Three-period model: `20260519171830_expand_semester_to_three_periods.sql` (UA 06/2022, Neni 5).
  - Descriptive assessments for grades 1-2: `20260519171751_add_descriptive_assessments_grades_1_2.sql`.
  - Special needs / IEP (`add_special_needs_and_iep`), school councils (`add_school_councils`), official report cards (`add_official_report_cards`), teacher licensing (`add_teacher_licensing`), parent meetings, national tests, language preference, multi-school + municipalities, diagnostics + portfolio, annual school plan, library, admin hierarchy, school inspection.
  - Subject seeds: `20260314155450_seed_kosovo_subjects_by_grade.sql`, school seeds: `20260520030000_seed_kosovo_schools.sql`, locality seeds: `20260520010000_seed_more_localities.sql`.
  - RLS / security hardening chain: `20260520050000_fix_rls_recursion.sql`, `20260520070000_harden_security_definer.sql`, `20260520080000_restrict_storage_listing.sql`, `20260520090000_auto_create_profile_on_signup.sql`, `20260520110000_revoke_handle_new_user.sql`, `20260520120000_messages_same_school_check.sql`.
- **Row-Level Security is the primary authorisation boundary.** Every table that contains user data has RLS policies. Recent example (`20260520120000_messages_same_school_check.sql`) introduces a `SECURITY DEFINER` helper `public.same_school_or_admin(receiver uuid)` so that messages can only be sent between users in the same school (or to/from admins without a school). When adding tables, **add RLS policies in the same migration** — never rely on the UI alone to enforce role boundaries. Prefer `SECURITY DEFINER` helper functions over inlined RLS expressions when the policy needs to look up another table (avoids the recursion issues fixed in `20260520050000_fix_rls_recursion.sql`).
- Realtime: enabled for messages in `20260520060000_enable_realtime_messages.sql`. Public-read tables (reference data, subjects) are explicitly granted in `20260520040000_public_read_reference_tables.sql` and `20260520040001_public_read_subjects_years.sql`.
- Auth: `auth.users` is bridged into `public.profiles` via the trigger added in `20260520090000_auto_create_profile_on_signup.sql` (revoked from public in `20260520110000_revoke_handle_new_user.sql`). The `profiles` table is the canonical source of `role` and `school_id` — almost every RLS policy reads from it.
- Env vars (see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Loaded by `src/lib/supabase.ts`. The app also has a demo mode (no Supabase required) — exercised from `LoginPage` for quick walkthroughs; data is fictional and not persisted.
- There is no `supabase/functions/` directory in this repo — no Edge Functions yet. All logic runs client-side against Postgres + RLS.

## Compliance constraints

`AUDIT_LIGJOR.md` (in repo root) is a legal/compliance audit written in Albanian. It maps the codebase to Kosovo education law (Ligji 04/L-032 për Arsimin Parauniversitar, UA 06/2022 për Vlerësimin, UA 19/2018 për Dokumentacionin Pedagogjik, Ligji 06/L-082 për Mbrojtjen e të Dhënave Personale, etc.) and lists gaps. Treat student data as **personal data of minors** — privacy-sensitive by default. Enforce role boundaries at the **database (RLS) layer**, not just the UI; an unauthenticated or wrong-role request must be denied by Postgres. When you touch tables that hold grades, attendance, IEP, behaviour, or messages, re-check the RLS policies and the audit-log writes (`src/lib/audit.ts`). Read AUDIT_LIGJOR.md before changing assessment scales, report-card formats, or roles.

## Styling

- Tailwind 3.4 with the default theme. Config at `tailwind.config.js` — `content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}']`, no custom theme extensions, no plugins.
- `src/index.css` is the Tailwind entry; PostCSS is set up via `postcss.config.js` + `autoprefixer`.
- Use Tailwind utility classes inline; the existing codebase does not use `@apply` or a component library. Common pattern: slate/blue palette, rounded cards, `border` + `bg-white` containers.
- Icons come from `lucide-react`. Lucide is excluded from Vite's dep optimisation (see `vite.config.ts`).

## Testing

- Test runner: Vitest with the jsdom environment (`vitest.config.ts`).
- Setup file: `src/test/setup.ts` (imports Testing Library jest-dom matchers).
- Test files live next to source as `*.test.ts(x)`. Examples: `src/lib/csvExport.test.ts`, `src/lib/formatDate.test.ts`.
- `globals: true` is enabled, so `describe`/`it`/`expect` are available without importing.
- Run with `npm test` (single run) or `npm run test:watch`.

There is no end-to-end harness; consider adding one if scope grows.

## Things to be careful about

- **Bolt origin.** The project was scaffolded with Bolt.new (see `.bolt/` directory and the Bolt badge in `README.md`). Do not delete `.bolt/config.json` or `.bolt/prompt` without checking — they configure the Bolt integration.
- **Albanian UI strings.** All user-facing labels and route slugs are Albanian (with sr/tr/bs translations via `src/lib/i18n/`). When adding UI, write Albanian first and add translation keys under `labelKey` (see the `NavItem` objects in `src/App.tsx`). Don't translate route paths.
- **Leftover Vite timestamp files.** A file like `vite.config.ts.timestamp-1774701134735-46cd59fe741f08.mjs` currently exists in repo root. These are generated by Vite's dev server and should **not** be committed. Add to `.gitignore` (or remove from the working tree) if you see them.
- **Role enforcement.** Never gate sensitive data only in `src/App.tsx` or `AuthContext`. The role check there decides which dashboard renders; the **data boundary** is RLS in Supabase. If you query a new table, write its RLS policy in the same migration.
- **Lazy imports.** Every page in `src/App.tsx` is `lazy(() => import(...))`. New pages must be registered there and wrapped in the existing `<Suspense>` boundary.
- **PWA / service worker.** `src/main.tsx` registers `/sw.js` in production. If you change cache strategies, update `public/sw.js`.
- **Vite chunking.** `vite.config.ts` has manual chunks for `recharts`, `@supabase`, `react-router`, `react-dom`. Heavy new deps may need their own chunk.

## Git workflow

- Default branch: `main`. CI (`.github/workflows/ci.yml`) runs against `main` for both `push` and `pull_request` events.
- Feature work happens on branches like `claude/<topic>-<id>`; this file was added on `claude/claude-md-docs-fsDeT`. According to the README the project already has 54+ merged PRs, so prefer small, focused PRs over large ones.
- Pre-PR checklist (from `README.md`): `npx tsc --noEmit`, `npx eslint src --quiet`, `npm run build` must all pass. CI runs the same three commands plus `npm ci` for install.
- Remote: `origin` points to `gmaliqi05-art/shkolla-kos` on GitHub.
- When adding a Supabase migration, name it with the next monotonic timestamp (`YYYYMMDDHHMMSS_short_description.sql`) so it sorts correctly after existing files. Migrations must be idempotent where reasonable (`CREATE OR REPLACE`, `DROP POLICY IF EXISTS`, etc.) — the codebase already follows this pattern.
