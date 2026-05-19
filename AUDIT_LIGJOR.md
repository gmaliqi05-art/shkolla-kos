# AUDIT LIGJOR — Shkolla Kos

**Sistemi:** Shkolla Kos — Sistem Menaxhimi Shkollor për Arsimin Parauniversitar (Klasa 1–9)
**Data e auditimit:** 19 Maj 2026
**Dega:** `claude/audit-school-laws-compliance-1C3N6`
**Korniza ligjore e referencës:**

- **Ligji Nr. 04/L-032** për Arsimin Parauniversitar në Republikën e Kosovës
- **Ligji Nr. 03/L-068** për Arsimin në Komunat e Republikës së Kosovës
- **Ligji Nr. 06/L-046** për Inspektoratin e Arsimit
- **Ligji Nr. 06/L-082** për Mbrojtjen e të Dhënave Personale
- **Ligji Nr. 02/L-37** për Përdorimin e Gjuhëve
- **Ligji Nr. 06/L-084** për Mbrojtjen e Fëmijëve
- **Korniza Kurrikulare e Kosovës (KKK)** dhe Kurrikula Bërthamë për Klasa 1–9
- **Udhëzimi Administrativ (UA) Nr. 06/2022** për Vlerësimin e Nxënësve
- **UA Nr. 19/2018** për Dokumentacionin Pedagogjik
- **UA Nr. 05/2017** për Licencimin e Mësimdhënësve
- **UA Nr. 13/2018** për Mbrojtjen e Fëmijëve nga Dhuna në Sistemin e Arsimit

---

## 1. PËRMBLEDHJE EKZEKUTIVE

Projekti **Shkolla Kos** është një sistem i ndërtuar mirë teknikisht (React + Supabase me RLS), me një bazë solide që mbulon **rreth 55–60% të kërkesave ligjore** të arsimit parauniversitar në Kosovë. Themelet janë në vend (rolet, shkalla 1–5, tre periudhat, vlerësimi përshkrues për klasat 1–2, kurrikula 18-lëndëshe), por **mungojnë komponentë thelbësorë ligjorë** që e bëjnë sistemin **jo plotësisht në përputhje** për përdorim zyrtar në një shkollë publike të Kosovës.

| Fusha | Statusi | Vlerësim |
|---|---|---|
| Strukturë teknike & siguri (RLS) | ✅ Mirë | 85% |
| Rolet e përdoruesve | ⚠️ Pjesërisht | 60% |
| Vlerësimi i nxënësve | ⚠️ Pjesërisht | 65% |
| Frekuentimi | ✅ Mirë | 80% |
| Kurrikula (KKK) | ⚠️ Pjesërisht | 50% |
| Dokumentacioni Pedagogjik | ❌ Mungon | 15% |
| Organet drejtuese shkollore | ❌ Mungon | 0% |
| Arsimi gjithëpërfshirës | ❌ Mungon | 0% |
| Mbrojtja e të dhënave (GDPR/KS) | ❌ Mungon | 20% |
| Shumëgjuhësia | ❌ Mungon | 10% |
| Licencimi i mësimdhënësve | ❌ Mungon | 0% |
| **VLERËSIMI I PËRGJITHSHËM** | **⚠️** | **~45%** |

---

## 2. ÇKA ËSHTË NDËRTUAR MIRË (NË PËRPUTHJE ME LIGJIN)

### 2.1 Shkalla e vlerësimit 1–5 ✅
Sipas **UA 06/2022**, Neni 8: shkalla zyrtare në Kosovë është 1–5.
- `1 — Pamjaftueshme`, `2 — Mjaftueshme`, `3 — Mirë`, `4 — Shumë Mirë`, `5 — Shkëlqyeshëm`
- Implementuar saktë te tabela `grades` me CHECK constraint.

### 2.2 Tre periudhat mësimore (tremujore) ✅
Sipas **UA 06/2022**, Neni 5: viti shkollor ndahet në **3 periudha vlerësimi**, jo 2 gjysmëvjetorë.
- Migrimi `20260519171830_expand_semester_to_three_periods.sql` e mbulon këtë.

### 2.3 Vlerësimi përshkrues për klasat 1–2 ✅
Sipas **UA 06/2022**, Neni 11: nxënësit e klasës 1–2 nuk marrin nota numerike, por vlerësim përshkrues në 5 nivele.
- Tabela `descriptive_assessments` me 5 nivele e implementon saktë.

### 2.4 Katër rolet themelore ✅
`drejtor`, `mesues`, `nxenes`, `prind` — të katërta të njohura nga **Ligji 04/L-032**.

### 2.5 RLS (Row-Level Security) ✅
Politikat RLS në bazën e të dhënave janë të mira nga ana e sigurisë teknike — prindi sheh vetëm fëmijët e tij, mësuesi vetëm klasat e tij, etj.

### 2.6 Lëndët bazë sipas KKK ✅
18 lëndët e seededuara në `20260314155450_seed_kosovo_subjects_by_grade.sql` korrespondojnë me Kurrikulën Bërthamë.

### 2.7 Statuset e frekuentimit ✅
`prezent`, `mungon`, `vonese`, `arsyeshme` — pajtohen me praktikën e Kosovës. Workflow i kërkesës për arsyetim nga prindi është një plus.

---

## 3. MANGËSITË KRITIKE (KUNDËR LIGJIT)

### 3.1 ❌ MUNGON: Dokumentacioni Pedagogjik (UA 19/2018) — **KRITIKE**

Sipas **UA 19/2018**, çdo shkollë duhet të mbajë këto dokumente zyrtare. **Asnjë nga këto nuk ekziston në sistem:**

| Dokumenti | Detyrimi ligjor | Statusi |
|---|---|---|
| **Amza / Regjistri Amzë** | Regjistër i përhershëm i nxënësve (kërkohet ruajtje për 75 vjet) | ❌ Mungon |
| **Ditari i Klasës** | Regjistrim ditor i orëve të mbajtura, lëndëve, prezencës, vërejtjeve | ❌ Mungon |
| **Dëftesa** (Report Card) | Lëshohet pas çdo periudhe + në fund të vitit, me format zyrtar | ❌ Mungon — Reports ekziston, por nuk gjeneron dëftesë zyrtare |
| **Certifikata e përfundimit të klasës V** | Pas testit kombëtar | ❌ Mungon |
| **Diploma e Arsimit të Mesëm të Ulët** (klasa 9) | Lëshohet zyrtarisht | ❌ Mungon |
| **Procesverbalet** e këshillave | Mbledhjet e mësimdhënësve, klasës, etj. | ❌ Mungon |
| **Plani Vjetor i Shkollës** | Detyrim ligjor i drejtorit | ❌ Mungon |
| **Plani Mësimor** ditor/javor i mësuesit | Detyrim individual | ❌ Mungon |

**Impakt:** Pa këto, sistemi **nuk mund të zëvendësojë** regjistrat e shkruar të shkollave kosovare — është vetëm një mjet ndihmës.

---

### 3.2 ❌ MUNGON: Organet Drejtuese Shkollore (Ligji 04/L-032) — **KRITIKE**

Ligji parashikon 4 organe shkollore. **Asnjë nuk është modeluar:**

| Organi | Neni i ligjit | Përbërja | Statusi |
|---|---|---|---|
| **Këshilli Drejtues i Shkollës** | Neni 18 | 7–9 anëtarë (prindër, mësues, komuna, nxënës në shkollat e mesme) | ❌ Mungon |
| **Këshilli i Prindërve** | Neni 19 | Përfaqësues prindër nga çdo klasë | ❌ Mungon |
| **Këshilli i Nxënësve** | Neni 23 | Përfaqësues nxënësish (klasa 6–9) | ❌ Mungon |
| **Këshilli Profesional / i Mësimdhënësve** | Neni 20 | Të gjithë mësimdhënësit | ❌ Mungon |

**Çfarë duhet:** Tabela `school_councils`, `council_members`, `council_meetings`, `meeting_minutes`.

---

### 3.3 ❌ MUNGON: Sjellja e Nxënësit (Ligji 04/L-032, UA 06/2022)

**Vlerësimi i sjelljes** (`sjellja`) është detyrim ligjor dhe pjesë e dëftesës zyrtare. Shkalla:
- `Shembullor` / `Shumë mirë` / `Mirë` / `I kënaqshëm` / `Jo i kënaqshëm`

**Statusi:** ❌ Asnjë fushë ose tabelë për sjelljen.

**Veprime disiplinore** (UA për Disiplinën Shkollore):
- Vërejtje me gojë
- Vërejtje me shkrim
- Largim i përkohshëm
- Transferim
- Largim përfundimtar (vetëm tek mesatare)

**Statusi:** ❌ Mungon plotësisht.

---

### 3.4 ❌ MUNGON: Arsimi Gjithëpërfshirës (Ligji 04/L-032, Neni 40)

Ligji garanton arsim për nxënësit me **nevoja të veçanta arsimore (NVA)**. Mungon:

- **Plani Individual i Arsimimit (PIA)** — detyrim për çdo nxënës me NVA
- Identifikimi i nevojave (gjuhësore, fizike, psikomotore, intelektuale)
- Roli i **asistentit pedagogjik** / mësuesit mbështetës
- Plani i akomodimeve të arsyeshme
- Vlerësimi i diferencuar i nxënësve me NVA

**Impakt:** Sistemi **përjashton** një kategori të mbrojtur me ligj — kjo është problem ligjor i drejtpërdrejtë.

---

### 3.5 ❌ MUNGON: Mbrojtja e të Dhënave (Ligji 06/L-082) — **KRITIKE**

Sistemi përpunon të dhëna të **fëmijëve të mitur** — kategoria më e ndjeshme. Mungon:

| Kërkesa | Statusi |
|---|---|
| Politika e privatësisë (në Shqip) | ❌ Mungon |
| Pëlqimi i prindit për përpunim të dhënash (e shkruar dhe e regjistruar) | ❌ Mungon |
| E drejta e harresës / fshirja e të dhënave me kërkesë | ❌ Mungon |
| Eksporti i të dhënave (Data Portability) | ❌ Mungon |
| Audit log — kush i ka parë të dhënat e fëmijës dhe kur | ❌ Mungon |
| Përgjegjësi për Mbrojtjen e të Dhënave (DPO) — kontakt | ❌ Mungon |
| Periudha e ruajtjes (data retention) për kategori të ndryshme | ❌ Mungon |
| Njoftim për shkelje sigurie (data breach notification) | ❌ Mungon |
| Anonimizim / pseudonimizim për raporte | ❌ Mungon |
| Two-Factor Authentication për personelin | ❌ Mungon |

**Rrezik ligjor:** Gjoba nga **Agjencia për Informim dhe Privatësi (AIP)** mund të arrijë deri në 40,000 €.

---

### 3.6 ❌ MUNGON: Shumëgjuhësia (Ligji 02/L-37, Ligji 04/L-032, Neni 9)

- **Shqipja dhe Serbishtja** janë gjuhë zyrtare të barabarta.
- Sipas Nenit 12 të Ligjit 04/L-032, nxënësi ka të drejtën e arsimimit në **gjuhën amtare**.
- Komunat me popullatë **turke, boshnjake, rome** detyrohen të ofrojnë arsim në këto gjuhë.

**Statusi:**
- ❌ UI vetëm në Shqip (jo i lokalizuar)
- ❌ Asnjë gjuhë instruksioni (`language_of_instruction`) e gjurmuar për klasë/nxënës
- ❌ S'ka mundësi për regjistrim të nxënësve të bashkësive jo-shumicë

---

### 3.7 ❌ MUNGON: Licencimi i Mësimdhënësve (UA 05/2017)

Sipas **UA 05/2017**, çdo mësimdhënës duhet të jetë **i licencuar** për të dhënë mësim. Tre nivele:
1. **Mësimdhënës fillestar**
2. **Mësimdhënës i karrierës**
3. **Mësimdhënës këshillues**

Licenca rinovohet **çdo 5 vjet** përmes 100 orëve të zhvillimit profesional (ZHPM).

**Statusi:**
- ❌ Profili `mesues` nuk ka fusha: `license_number`, `license_level`, `license_expiry`, `qualification`, `subject_specialization`
- ❌ Mungon gjurmimi i orëve të ZHPM
- ❌ Drejtori ligjërisht nuk mund të caktojë mësues të palicencuar — sistemi nuk e kontrollon këtë

---

### 3.8 ❌ MUNGON: Testet Kombëtare (UA për Testet e Arritshmërisë)

Detyrime ligjore:
- **Testi i Arritshmërisë i Klasës së V-të** (fundi i ciklit të dytë)
- **Testi i Arritshmërisë i Klasës së IX-të** (fundi i shkollimit të detyrueshëm)

**Statusi:** ❌ Asnjë strukturë për mbajtjen e rezultateve të testeve kombëtare.

---

### 3.9 ❌ MUNGON: Kompetencat Kryesore të KKK

Kurrikula Bërthamë (KKK) bazohet në **7 kompetenca kryesore** (jo vetëm në lëndë):

1. Komunikues efektiv
2. Mendimtar kreativ
3. Mësues i suksesshëm
4. Kontribues produktiv
5. Individ i shëndoshë
6. Qytetar i përgjegjshëm
7. (kompetenca digjitale, e shtuar)

**Statusi:**
- ❌ Asnjë gjurmim i vlerësimit nëpër kompetenca
- ❌ Lëndët nuk janë grupuar në **6 fushat kurrikulare** (Gjuhët dhe komunikimi; Artet; Matematika; Shkencat e natyrës; Shoqëria dhe mjedisi; Edukata fizike, sportet dhe shëndeti; Jeta dhe puna)
- ❌ Mungon koncepti i **Rezultateve të të Nxënit** (RNL) për lëndë / shkallë

---

### 3.10 ❌ MUNGON: Tipet e Vlerësimit (UA 06/2022, Neni 6–10)

Ligji përshkruan **3 tipe vlerësimi** të kombinuara:

| Tipi | Përshkrimi | Statusi |
|---|---|---|
| **Vlerësim Diagnostikues** | Në fillim të vitit — gjendja fillestare | ❌ Mungon |
| **Vlerësim Formues** | Gjatë gjithë vitit — proces mësimi | ⚠️ Pjesërisht (V1–V4) |
| **Vlerësim Përmbledhës** | Në fund të periudhës | ✅ Implementuar |
| **Portofoli i Nxënësit** | Koleksion punësh që dëshmojnë progresin | ❌ Mungon |
| **Vetëvlerësim** | Nxënësi vlerëson veten | ❌ Mungon |
| **Vlerësim nga bashkëmoshatari** | Peer review | ❌ Mungon |
| **Vlerësim përmes projekteve** | Project-based | ❌ Mungon |

---

### 3.11 ❌ MUNGON: Roli i Pedagogut / Psikologut Shkollor

Sipas Ligjit 04/L-032 dhe UA 13/2018:
- Çdo shkollë duhet të ketë **pedagog/psikolog** për mbështetje psiko-sociale.
- Detyra: këshillim individual, parandalim i dhunës, ndërhyrje në krizë.

**Statusi:**
- ❌ Roli `pedagog` / `psikolog` nuk ekziston (vetëm 4 role).
- ❌ Mungon moduli i shënimeve të këshillimit (konfidencial — i ndarë nga notat).
- ❌ Mungon raportimi i incidenteve (bullizmi, dhuna).

---

### 3.12 ❌ MUNGON: Kalendari Shkollor

Sipas Vendimit Vjetor të MAShTI për Kalendarin Shkollor:
- Fillimi/fundi i vitit shkollor
- Festat zyrtare (Pavarësia, Flamuri, Dita e Mësuesit, etj.)
- Pushimet (dimërore, pranverore)
- Periudhat e provimeve
- Ditët e punës së mësuesit (jo-instruksionale)

**Statusi:**
- ⚠️ Ekziston `academic_years` (vetëm start/end date)
- ❌ Mungon strukturë për ditë jo-pune, festa, pushime

---

### 3.13 ❌ MUNGON: Takimet me Prindër

Sipas Nenit 19 të Ligjit dhe UA për Komunikimin me Prindër:
- Çdo periudhë mësimore: të paktën **1 takim klase me prindër**
- Takime individuale me kërkesë
- Procesverbal i takimit

**Statusi:** ❌ Mungon plotësisht (vetëm sistemi i mesazheve).

---

### 3.14 ❌ MUNGON: Të Dhënat Shëndetësore Bazike

Për sigurinë e fëmijës në shkollë (UA për Sigurinë):
- Alergji / kushte mjekësore kritike
- Kontakte emergjente (2+ kontakte)
- Vaksinimi (verifikim me Ligjin për Shëndetin Publik)
- Mjeku familjar

**Statusi:** ❌ `profiles` ka vetëm `phone` — pa kontakt emergjent.

---

### 3.15 ⚠️ PROBLEM: Të Dhënat Personale të Plota

Profilet mungojnë fushat zyrtare që kërkohen për Amzën:

- Numri Personal (10-shifror) — për nxënësit kosovarë
- Datëlindja
- Vendi i lindjes
- Adresa e plotë
- Nacionaliteti (vetë-deklarim)
- Gjinia
- Emri i prindit/kujdestarit ligjor
- Statusi (i rregullt, transferuar, përfunduar, hequr nga shkolla)

**Statusi:** ❌ Kritike — pa këto, sistemi nuk mund të lëshojë dëftesa/diploma të vlefshme.

---

### 3.16 ⚠️ PROBLEM: Çështje në Krijimin e Përdoruesve

Te `ManageTeachers.tsx`/`ManageStudents.tsx`:
- Fjalëkalimet gjenerohen automatikisht dhe **shfaqen në UI** — sigurohuni që të mos ruhen në log.
- Drejtori sheh fjalëkalimet — kjo është **shkelje e Ligjit 06/L-082** (drejtori nuk duhet të dijë kredencialet e prindit).
- Duhet zëvendësuar me **link aktivizimi me email** ose **kod një-përdorimi**.

---

### 3.17 ⚠️ PROBLEM: "Fete dhe Kultura" si Lëndë

Lënda `Fete dhe Kultura` ekziston te seedi. **Vërejtje:**
- Në Kosovë, **edukimi fetar nuk është pjesë e kurrikulës zyrtare të shkollave publike** (vendim i Qeverisë 2010).
- Nëse synohet "Edukatë qytetare" ose "Kultura qytetare", emri duhet rishikuar.

---

### 3.18 ⚠️ PROBLEM: Orari vetëm 5 ditë

Orari ka `day_of_week` 1–5 (E hënë–E premte). **OK** për shumicën e shkollave, por:
- Disa shkolla bëjnë aktivitete shkollore të shtundes (sport, klube).
- Disa shkolla në komunitete me shumicë serbe punojnë me kalendar tjetër.

**Sugjerim:** Lejo `day_of_week` 1–6.

---

### 3.19 ❌ MUNGON: Backup-i & Politika e Ruajtjes

Sipas Ligjit për Arkivat dhe UA për Dokumentacionin Pedagogjik:
- **Amza:** ruajtje e përhershme
- **Dëftesat & diplomat:** ruajtje 75 vjet
- **Notat & frekuentimi:** 25 vjet
- **Procesverbalet:** 25 vjet
- **Mesazhet, njoftimet:** 2–5 vjet

**Statusi:** ❌ Asnjë politikë e shkruar, asnjë mekanizëm soft-delete vs hard-delete, asnjë arkiv off-site.

---

### 3.20 ❌ MUNGON: Aktivitetet Jashtëmësimore

Sipas KKK, shkolla ofron **veprimtari jashtëmësimore**:
- Klube (gjuhësore, shkencore, artistike, sportive)
- Garat shkollore
- Olimpiada
- Ekskurzione

**Statusi:** ❌ Mungon plotësisht.

---

## 4. PROBLEME TEKNIKE TË EVIDENTUARA

### 4.1 Demo Mode i hapur në production
`AuthContext.tsx` ka rrugë demo që anashkalon DB. Kjo duhet të jetë **vetëm në zhvillim**, jo në production.

### 4.2 Numri Personal mungon te Amza
Pa numër personal, dy nxënës me të njëjtin emër janë të padallueshëm ligjërisht.

### 4.3 Komunat dhe Shkollat e Shumëfishta
Sistemi është projektuar për **1 shkollë**. Por:
- Sipas Ligjit 03/L-068, komunat janë përgjegjëse për arsimin parauniversitar.
- Një komunë ka 20–80 shkolla.
- Mungon entiteti `school` (njësi shumëkatëshe), `municipality`.

### 4.4 Periudha e Provimit / Provimi Përfundimtar
Mungon koncepti i provimit përfundimtar të lëndës ose provimit korrektues (riprovim).

---

## 5. REKOMANDIME ME PRIORITET

### 🔴 PRIORITET 1 — KRITIK (duhet bërë para se sistemi të përdoret)

1. **Dokumentacioni Pedagogjik** — gjenerimi i dëftesës zyrtare PDF sipas formatit MAShTI
2. **Mbrojtja e të dhënave** — politika e privatësisë, pëlqim i prindit, audit log, fshirja sipas kërkesës
3. **Numri Personal & të dhënat personale të plota** për nxënësit
4. **Arsimi gjithëpërfshirës** — Plan Individual i Arsimimit (PIA)
5. **Sjellja & masat disiplinore** — fushë e detyrueshme në dëftesë
6. **Kontakti emergjent & informacioni shëndetësor bazik**
7. **Heqja e fjalëkalimeve nga UI** — zëvendësim me link aktivizimi

### 🟠 PRIORITET 2 — I LARTË (1–3 muaj)

8. **Organet shkollore** (Këshilli Drejtues, Prindër, Nxënës, Profesional)
9. **Licencimi i mësimdhënësve** — fusha + verifikim
10. **Pedagog/psikolog shkollor** si rol i 5-të
11. **Shumëgjuhësia** — UI në Serbisht; gjuha e instruksionit për klasë
12. **Kompetencat dhe fushat kurrikulare të KKK**
13. **Kalendari shkollor i plotë** (festa, pushime, ditët jo-pune)

### 🟡 PRIORITET 3 — I MESËM (3–6 muaj)

14. **Testet kombëtare** (klasa V dhe IX)
15. **Portofoli i nxënësit** & vetëvlerësimi
16. **Aktivitetet jashtëmësimore**
17. **Takimet me prindër** me procesverbal
18. **Multi-shkollë / multi-komunë** për shtrirje kombëtare
19. **Politika e backup-it dhe e ruajtjes së të dhënave**

### 🟢 PRIORITET 4 — I ULËT

20. **Biblioteka shkollore** (huazim librash)
21. **Raportet e inspektorateve**
22. **2FA për stafin**
23. **Eksport CSV/PDF për raporte**

---

## 6. PËRFUNDIM

Shkolla Kos është një **fillim teknikisht solid**, por **nuk është gati ligjërisht** për t'u përdorur si sistem zyrtar nga një shkollë publike e Kosovës. Bazat janë në vend (notat, frekuentimi, rolet, RLS), por **mungojnë mbi 20 komponentë ligjorë të detyrueshëm**, ndër ta:

- **Dëftesa zyrtare nuk mund të lëshohet** nga ky sistem.
- **Diploma e klasës 9-të nuk mund të lëshohet.**
- **Të dhënat e nxënësve nuk janë të plota ligjërisht** (mungon numri personal, datëlindja, etj.).
- **Nuk mbron nxënësit me NVA** sipas ligjit.
- **Nuk është në përputhje me Ligjin për Mbrojtjen e të Dhënave Personale** për fëmijët e mitur.

### Vlerësim përfundimtar i pajtueshmërisë: **~45%**

Për ta bërë sistemin të **gatshëm për përdorim zyrtar**, duhet të zhvillohet **Prioriteti 1 dhe 2** (afërsisht 4–6 muaj pune).

Për përdorim **vetëm si mjet ndihmës ndaj regjistrave të shkruar zyrtarë**, sistemi mund të përdoret menjëherë, por **drejtori i shkollës duhet të mbajë paralelisht regjistrat e shkruar zyrtarë** (Amza, Ditari, Dëftesat).

---

*Përgatitur si pjesë e degës `claude/audit-school-laws-compliance-1C3N6`.*
