# Shkolla-Kos

Sistem menaxhimi shkollor për shkollat fillore dhe të mesme të ulëta të Republikës së Kosovës. Mbështet plotësisht legjislacionin arsimor të Kosovës (Ligji 04/L-032 për Arsimin Parauniversitar, 03/L-068 për Arsimin në Komunat).

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-pdpkdybx)

## Tiparet kryesore

- **8 role** me kontroll të plotë qasjeje (RBAC):
  - Drejtor, Mësues, Nxënës, Prind, Pedagog
  - Drejtor Komunal (DKA), Inspektor, Ministër (MAShTI)
- **4 gjuhë**: shqip, serbisht, turqisht, boshnjak
- **Të dhëna zyrtare**: 38 komuna, 162 vendbanime, 102 shkolla të Kosovës
- **Real-time** mesazhe dhe njoftime
- **PWA**: instalim në desktop/mobile + offline mode
- **Eksportim CSV** për lista (nxënës, mësues, prindër)
- **Dëftesa zyrtare** të printueshme sipas formatit ligjor
- **Modul i inspektimit** me gjetjet dhe rekomandimet
- **PIA/NVA**: Plani Individual i Arsimimit për nxënës me nevoja të veçanta
- **Këshilla shkollore**, plan vjetor, kalendar, bibliotekë

## Stack teknik

| Layer | Teknologjia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v7 |
| State | React Context + hooks |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Charts | Recharts |
| Ikona | Lucide React |

## Zhvillimi lokal

### Kërkesa

- Node.js 20+
- npm
- Llogari Supabase (falas: https://supabase.com)

### Setup

```bash
# 1. Klono repo-n
git clone https://github.com/gmaliqi05-art/shkolla-kos.git
cd shkolla-kos

# 2. Instalo dependencies
npm install

# 3. Konfiguro Supabase
cp .env.example .env
# Edito .env dhe vendos:
#   VITE_SUPABASE_URL=https://<your-project>.supabase.co
#   VITE_SUPABASE_ANON_KEY=<your-anon-key>

# 4. Apliko migrations në Supabase
# Përmes Supabase CLI ose dashboard
# (Migrations janë në supabase/migrations/)

# 5. Nis aplikacionin
npm run dev
```

Aplikacioni do të hapet në http://localhost:5173

### Komanda

```bash
npm run dev        # Dev server me HMR
npm run build      # Build production
npm run preview    # Preview build lokalisht
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript type-check
```

## Struktura

```
src/
├── components/        # Komponente të përbashkëta (Toast, Skeleton, FileUpload, etj)
├── contexts/          # React contexts (AuthContext)
├── lib/               # Utils (supabase client, formatDate, csvExport, i18n)
├── pages/             # Faqet sipas rolit
│   ├── director/      # ~27 rrugë
│   ├── teacher/       # ~20 rrugë
│   ├── student/       # ~10 rrugë
│   ├── parent/        # ~12 rrugë
│   ├── pedagog/       # ~10 rrugë (shumica përdorin shared)
│   ├── dka/           # ~7 rrugë
│   ├── inspektor/     # ~6 rrugë
│   ├── ministri/      # ~9 rrugë
│   └── shared/        # MessagesPage, ProfileSettings, Portfolio, etj
└── types/             # TypeScript types

supabase/
└── migrations/        # 35+ SQL migrations
```

## Rolet & qasja

| Roli | Përdoruesi tipik | Qasja kryesore |
|---|---|---|
| **drejtor** | Drejtor shkolle | Nxënës/Mësues, Notat, Raporte, Dëftesa, Disiplina, NVA, Këshilla |
| **mesues** | Mësues lënde | Klasat, Vendos nota, Frekuentimi, Ditari, Detyrat, Sjellja |
| **nxenes** | Nxënës | Notat e mia, Orari, Frekuentimi, Mesazhe, Portofol |
| **prind** | Prind nxënësi | Notat e fëmijës, Frekuentimi, PIA, Takime, Mesazhe |
| **pedagog** | Psikolog/Pedagog shkolle | NVA, PIA, Diagnostikues, Portofol |
| **drejtor_komunal** | DKA | Shkollat e komunës, Vendbanime, Inspektime |
| **inspektor** | Inspektor arsimor | Inspektime në shkolla, Gjetje, Rekomandime |
| **ministri** | MAShTI | Statistika kombëtare, Stafi administrativ |

Sistemi mbron çdo rresht përmes **Row-Level Security (RLS)** policies — secili rol sheh vetëm të dhënat e tij.

## Deployment

Build-i prodhon static files që mund të hostohen kudo:

```bash
npm run build
# Output në dist/
```

Opsione hostimi:
- **Vercel/Netlify**: import nga GitHub, build command `npm run build`, output `dist/`
- **Cloudflare Pages**: njëlloj
- **Supabase Hosting** (përdor Edge Functions)
- **Bolt.new**: hapet drejtpërdrejt nga repo

## Demo mode

Aplikacioni ka **demo mode** për shfaqje — nuk kërkon autentikim Supabase. Hap aplikacionin dhe klik te një nga rolet demo në LoginPage. Të dhënat janë fiktive dhe ndryshimet nuk ruhen.

## Kontribuim

Pull requests janë të mirëpritura. Para se të krijoni PR:

1. Run `npx tsc --noEmit` — duhet kalojë
2. Run `npx eslint src --quiet` — duhet kalojë
3. Run `npm run build` — duhet kalojë

GitHub Actions CI verifikon këto automatikisht në çdo PR.

## Licenca

I lirë për përdorim brenda institucioneve arsimore të Kosovës.

---

**Versioni**: 1.0 (Maj 2026) | **PR të bashkuara**: 54+
