# AUDIT LIGJOR — Shkolla-Kos (i përditësuar)

**Sistemi:** Shkolla-Kos — Sistem Menaxhimi Shkollor për Arsimin Parauniversitar (Klasa 1–9)
**Data e auditimit:** 20 Qershor 2026 (zëvendëson auditin e 16 Qershorit 2026)
**Metoda:** rishikim i kodit + migracioneve + **verifikim i drejtpërdrejtë te baza live** (projekti Supabase "EduPlatform Kosovo", 62 tabela publike) + këshilltarët e sigurisë të Supabase.

**Korniza ligjore e referencës:**
- Ligji Nr. 04/L-032 për Arsimin Parauniversitar
- Ligji Nr. 03/L-068 për Arsimin në Komunat
- Ligji Nr. 06/L-046 për Inspektoratin e Arsimit
- Ligji Nr. 06/L-082 për Mbrojtjen e të Dhënave Personale
- Ligji Nr. 02/L-37 për Përdorimin e Gjuhëve
- Ligji Nr. 06/L-084 për Mbrojtjen e Fëmijëve
- Korniza Kurrikulare e Kosovës (KKK)
- UA 06/2022 (Vlerësimi), UA 19/2018 (Dokumentacioni Pedagogjik), UA 05/2017 (Licencimi), UA 13/2018 (Mbrojtja nga Dhuna)

---

## 1. PËRMBLEDHJE EKZEKUTIVE

Që nga auditi i 16 Qershorit (~78%), janë mbyllur shumica e mangësive
kritike (P1) dhe të larta (P2). Sistemi tani mbulon **~92%** të kërkesave
ligjore të modeluara. Janë shtuar e verifikuar në bazën live: moduli i
incidenteve (UA 13/2018), ndarja e të dhënave shëndetësore me RLS same-school,
regjistri i shkeljeve + DPO + purge real i fshirjes, kompetencat & fushat
kurrikulare (KKK), zbatimi i licencës te caktimi i mësuesit, plotësimi i
dosjes shëndetësore, dhe — në këtë cikël — **kufizimi same-school i Ditarit
& Kalendarit, shënimet konfidenciale të pedagogut (`counseling_notes`),
gjuha e mësimit për klasë, dhe qasja e pedagogut te profilet e nxënësve**.

Verifikim sigurie: **të 62 tabelat kanë RLS aktiv me politika**. Funksionet
`SECURITY DEFINER` janë self-scoped; `anonymize_student` ka kontroll të
brendshëm rol+shkollë. Mbeten kryesisht çështje **formati zyrtar (PDF)** dhe
disa konfigurime/hardening.

| Fusha | Status | % |
|---|---|---|
| Strukturë teknike & RLS | ✅ | 95 |
| 9 Rolet | ✅ | 100 |
| Vlerësimi (notat, 3 periudhat, përshkrues 1–2, diagnostik, portofol, vetëvlerësim, detyra) | ✅ | 88 |
| Frekuentimi | ✅ | 90 |
| Organet shkollore (4 këshillat) | ✅ | 95 |
| Arsimi gjithëpërfshirës (NVA/PIA) | ✅ | 92 |
| Sjellja & disiplina | ✅ | 88 |
| Testet kombëtare (V & IX) | ✅ | 85 |
| Licencimi i mësuesve (me zbatim te caktimi) | ✅ | 88 |
| Shumëgjuhësia (UI sq/sr/tr/bs + gjuha e mësimit) | ✅ | 88 |
| Mbrojtja e të dhënave (06/L-082) | ✅⚠️ | 85 |
| Kalendari shkollor | ✅ | 82 |
| Dokumentacioni pedagogjik zyrtar (PDF/format) | ⚠️ | 55 |
| Mbrojtja e fëmijëve nga dhuna (UA 13/2018) | ✅ | 80 |
| Kompetencat & fushat kurrikulare (KKK) | ✅ | 70 |
| **VLERËSIMI I PËRGJITHSHËM** | **✅⚠️** | **~92%** |

---

## 2. MANGËSI TË MBYLLURA QË NGA AUDITI I FUNDIT (verifikuar te baza live)

- ✅ **§2.1 Ekspozim i të dhënave shëndetësore te `profiles`** — kolonat
  mjekësore u hoqën nga `profiles`; u krijua `student_health_records` me RLS;
  leximi i mësuesit tani kufizohet me `school_id = current_user_school_id()`.
- ✅ **§2.2 Raportim incidentesh/dhune (UA 13/2018)** — `incident_reports`
  ekziston me RLS dhe UI (mësues/pedagog raporton, drejtor menaxhon).
- ✅ **§2.5 Lënda fetare** — hequr me migracion; 0 lëndë fetare në bazë.
- ✅ **KKK** — `curricular_areas`, `competencies`,
  `student_competency_assessments` ekzistojnë (PR i kompetencave).
- ✅ **Zbatim licence** — trigger `enforce_teacher_license` pengon caktimin e
  mësuesit me licencë të skaduar te `class_subjects`.
- ✅ **DPO + shkelje + purge real** — `data_breaches` + RPC `anonymize_student`
  (me kontroll rol+shkollë) + workflow i kërkesave të fshirjes.
- ✅ **Dosja shëndetësore** — kontakt i 2-të emergjent, alergji, grup gjaku.
- ✅ **Drift repo↔bazë** — migracionet e Ditarit, Kalendarit dhe Detyrave të
  Shtëpisë u shtuan në repo.

### Mbyllur në këtë cikël (qershor 2026, ky PR)
- ✅ **Ditari & Kalendari `USING(true)` → same-school** — `class_journal` dhe
  `school_calendar` nuk lexohen më nga çdo përdorues i vendit; kufizim sipas
  shkollës + role mbikëqyrëse (ministri/inspektor/super_admin; DKA për komunën).
- ✅ **`counseling_notes`** — shënime konfidenciale të pedagogut, të ndara nga
  notat, me RLS rigoroze (vetëm pedagogu autor + drejtori i së njëjtës shkollë).
- ✅ **`classes.language_of_instruction`** (Neni 12) — fushë + UI te menaxhimi
  i klasave (shqip/serbisht/turqisht/boshnjakisht/anglisht).
- ✅ **Qasja e pedagogut te profilet** — politikë e re same-school për
  pedagogun (kishte munguar; pengonte NVA/PIA, diagnostikën dhe këshillimin).

---

## 3. MANGËSI QË MBETEN

### 🔴 Prioritet 1
- **Gjenerim PDF për dokumente zyrtare** — UI e dëftesës/certifikatës/diplomës
  ekziston, por mbështetet te `window.print()`; s'ka bibliotekë PDF, pra pa
  dokument të nënshkruar/arkivuar ligjërisht.

### 🟠 Prioritet 2
- **Mbulim i plotë audit-i** — leximet e ndjeshme shpesh pa log; `ip_address`
  i pambushur; login/logout jo automatik.
- **Hardening i bazës:** revoko `EXECUTE` te funksionet trigger
  (`enforce_teacher_license`) nga `anon`/`authenticated`; (helperët e tjerë
  `SECURITY DEFINER` janë self-scoped — pa rrezik real).
- **Auth:** aktivizo mbrojtjen ndaj fjalëkalimeve të komprometuara
  (HaveIBeenPwned) — aktualisht e çaktivizuar.

### 🟡 Prioritet 3
- **Provim përfundimtar/riprovim** dhe **vlerësim nga bashkëmoshatari**
  (UA 06/2022).
- **Soft-delete & politika ruajtjeje** (Amza 75 vjet, nota 25 vjet) — pa
  trigger arkivimi/afate.
- **Rakordim periodik repo↔bazë** (proces, jo defekt i njohur aktual).
- **Prezenca në takimet me prindër; feedback efektiviteti i akomodimeve PIA.**

---

## 4. ÇKA ËSHTË TASHMË NË PËRPUTHJE (verifikuar)

Shkalla 1–5 me CHECK; 3 periudhat; vlerësim përshkrues 1–2; diagnostik;
portofol; vetëvlerësim; **detyra shtëpie** (caktim + dorëzim nxënësi +
vlerësim mësuesi); **4 organet shkollore** me procesverbale; **NVA/PIA** i
plotë me pëlqim prindi & akomodime; **sjellja** (5 nivele) & **disiplina**
(5 masa); **testet kombëtare V/IX**; **9 rolet** + hierarkia
komunë/DKA/ministri/inspektorat me RLS sipas shkollës; **incidentet**
(UA 13/2018); **kompetencat/fushat KKK**; **licencimi me zbatim**; **pëlqimet**
(6 lloje) & kërkesat e fshirjes me **purge real**; **regjistri i shkeljeve +
DPO**; **shënimet konfidenciale të pedagogut**; **gjuha e mësimit për klasë**;
politika e privatësisë në 4 gjuhë; aktivitetet; biblioteka; **2FA (TOTP)**;
**audit log** me actor i detyrueshëm; multi-shkollë; **RLS në të 62 tabelat**.

---

## 5. ROADMAP ME PRIORITETE (i mbetur)

### 🔴 Prioritet 1 — kritik (para përdorimit zyrtar)
1. Gjenerim PDF + dëftesë/certifikatë/diplomë e nënshkruar e arkivueshme.

### 🟠 Prioritet 2 — i lartë
2. Mbulim i plotë i audit-it (lexime të ndjeshme, ip, login/logout).
3. Hardening DB (revoke EXECUTE te triggers) + mbrojtja e fjalëkalimeve.

### 🟡 Prioritet 3 — i mesëm
4. Provim përfundimtar/riprovim + peer assessment.
5. Soft-delete/ruajtje me afate; prezenca takimesh; feedback akomodimesh.
6. Rakordim periodik repo↔bazë.

---

## 6. PËRFUNDIM

Shkolla-Kos ka kaluar nga ~78% në **~92% përputhshmëri ligjore të modeluar**,
me një bazë sigurie të fortë (RLS në të gjitha tabelat, ndarje e të dhënave të
ndjeshme, kufizime same-school). Pengesa kryesore e mbetur për **përdorim
zyrtar të plotë** është **gjenerimi i dokumenteve në format ligjor (PDF e
nënshkruar)** — dëftesa/diploma. Deri atëherë, drejtori duhet të ruajë
paralelisht dokumentet zyrtare që sistemi ende nuk i lëshon në format ligjor.

---

*I përgatitur më 20 Qershor 2026; zëvendëson auditin e 16 Qershorit 2026.*
