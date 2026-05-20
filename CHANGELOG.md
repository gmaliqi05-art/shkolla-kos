# Changelog

Të gjitha ndryshimet e dukshme të projektit.

## Maj 2026

### Paketat 47-52 (UX polish + audit fixes)

- **Paketa 52**: Hardening i SECURITY DEFINER functions (REVOKE EXECUTE anon), `loading="lazy"` për 5 imazhe, aria-label për 3 ikon-buttons në Header
- **Paketa 51**: PWA — manifest.webmanifest + Service Worker + offline cache (3 strategji)
- **Paketa 50**: i18n më të thelluar — ~25 keys të rinj për dashboards dhe ProfileSettings
- **Paketa 49**: Real-time messaging me Supabase Realtime (messages + announcements)
- **Paketa 48**: Avatar upload në ProfileSettings + Header me FileUpload component
- **Paketa 47**: Skeleton loaders për 3 dashboards e mbetura (Teacher, Student, Parent)

### Paketat 41-46 (kritike + features)

- **Paketa 46**: Rregullim funksionesh në 4 dashboards (alert links, fake onClick, missing actions)
- **Paketa 45**: Eksportim CSV për ManageStudents, ManageTeachers, ManageParents
- **Paketa 44**: Faqja "Profili Im" për 8 rolet (informacion + ndrysho fjalëkalimin)
- **Paketa 43**: Bug fixes (localStorage Incognito crash, signOut session cleanup, useEffect deps)
- **Paketa 42**: 🔥 Rregullim RLS recursion në profiles + tabela referencë (ERROR 42P17 fix)
- **Paketa 41**: 🔥 Public read për tabelat referencë (komunat/fshatrat/shkollat të dukshme nga demo)

### Paketat 31-40 (UX polish)

- **Paketa 40**: Skeleton loaders për Director/Ministri/DKA dashboards
- **Paketa 39**: formatDate util + standardizim locale `sq-AL`
- **Paketa 38**: Error handling për Promise.all() në 6 dashboards
- **Paketa 37**: Empty states me veprime kontekstuale (7 faqe)
- **Paketa 36**: Toast notifications (28 alert() → useToast)
- **Paketa 35**: Konfirmim para fshirjes + tabela responsive për mobile
- **Paketa 34**: Integrim i i18n në Sidebar dhe Navigation (4 gjuhë)
- **Paketa 33**: Code-splitting (bundle 1,486 kB → 72 kB initial)
- **Paketa 32**: Pastrimi i tipave TypeScript (48 → 0 gabime)
- **Paketa 31**: Përmirësime funksionaliteti faqesh (klikueshmëri, butona veprimi)

## Paketat 1-30

Infrastruktura fillestare, modulet ligjore (NVA/PIA, këshilla, dëftesa, inspektim, licencim, plan vjetor, bibliotekë), seedim i 38 komunave + 162 vendbanimeve + 102 shkollave të Kosovës.
