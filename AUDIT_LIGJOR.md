# AUDIT LIGJOR — Shkolla-Kos (i përditësuar)

**Sistemi:** Shkolla-Kos — Sistem Menaxhimi Shkollor për Arsimin Parauniversitar (Klasa 1–9)
**Data e auditimit:** 16 Qershor 2026 (zëvendëson auditin e 19 Majit 2026)
**Metoda:** rishikim i kodit + migracioneve + **verifikim i drejtpërdrejtë te baza live** (projekti Supabase "EduPlatform Kosovo", 56 tabela publike).

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

Që nga auditi i Majit (~45%), sistemi është zgjeruar ndjeshëm: tani mbulon
**~78%** të kërkesave ligjore. Janë shtuar (dhe verifikuar në bazën live):
9 rolet, 4 organet shkollore, NVA/PIA i plotë, sjellja & disiplina, testet
kombëtare V/IX, licencimi (fushat), pëlqimet & kërkesat e fshirjes, politika
e privatësisë në 4 gjuhë, audit log, 2FA, multi-shkollë/komunë, kalendari,
takimet me prindër, biblioteka, aktivitetet, diagnostika & portofoli.

Mbeten disa **mangësi kritike ligjore/sigurie** dhe një **drift repo↔bazë**.

| Fusha | Status | % |
|---|---|---|
| Strukturë teknike & RLS | ✅ | 88 |
| 9 Rolet | ✅ | 100 |
| Vlerësimi (notat, 3 periudhat, përshkrues 1–2, diagnostik, portofol, vetëvlerësim) | ✅⚠️ | 80 |
| Frekuentimi | ✅ | 85 |
| Organet shkollore (4 këshillat) | ✅ | 95 |
| Arsimi gjithëpërfshirës (NVA/PIA) | ✅ | 90 |
| Sjellja & disiplina | ✅ | 85 |
| Testet kombëtare (V & IX) | ✅ | 85 |
| Licencimi i mësuesve | ⚠️ | 70 |
| Shumëgjuhësia (UI sq/sr/tr/bs) | ✅⚠️ | 80 |
| Mbrojtja e të dhënave (06/L-082) | ⚠️ | 65 |
| Kalendari shkollor | ⚠️ | 70 |
| Dokumentacioni pedagogjik zyrtar (PDF/format) | ⚠️ | 55 |
| Mbrojtja e fëmijëve nga dhuna (UA 13/2018) | ❌ | 20 |
| Kompetencat & fushat kurrikulare (KKK) | ❌ | 15 |
| **VLERËSIMI I PËRGJITHSHËM** | **⚠️** | **~78%** |

---

## 2. MANGËSI KRITIKE (verifikuar te baza live)

### 2.1 🔴 Ekspozim i të dhënave të ndjeshme te `profiles`
Politika `Teachers can read relevant profiles` është:
`current_user_role()='mesues' AND role IN ('nxenes','prind','mesues')` —
**pa kufizim shkolle dhe pa kufizim kolone**. Pra çdo mësues lexon çdo profil
nxënësi/prindi **në të gjithë vendin**, përfshirë `medical_conditions`,
`family_doctor`, kontaktet emergjente, `personal_number`, datëlindjen.
Shkel Ligjin 06/L-082 (minimizimi i të dhënave).
**Zgjidhje:** ndaj të dhënat mjekësore në tabelë `student_health_records` me
RLS vetëm drejtor/pedagog; shto kufizim same-school te leximi i mësuesit.

### 2.2 🔴 Mungon raportimi i incidenteve/dhunës/bullizmit (UA 13/2018)
Verifikuar: `incident_reports` **nuk ekziston**. S'ka dokumentim incidentesh,
njoftim të detyrueshëm te drejtori, njoftim prindi brenda 24h, raportim
policie. **Zgjidhje:** `incident_reports` + `incident_follow_ups` + RLS
konfidenciale + UI raportimi/menaxhimi (mësues raporton, drejtor/pedagog
menaxhon, prind sheh vetëm fëmijën e vet).

### 2.3 🔴 Drift repo ↔ bazë live
`class_journal` (Ditari) dhe `school_calendar` **ekzistojnë në bazë** por
s'kishin migracion në repo → një deploy i ri nga repo do t'i thyente.
**Status: PJESËRISHT I RREGULLUAR** — migracionet u shtuan
(`20260616100000_add_class_journal.sql`, `20260616100100_add_school_calendar.sql`).
Rekomandohet një rakordim i plotë periodik repo↔bazë.

### 2.4 🔴 S'ka gjenerim PDF për dokumente zyrtare
Asnjë bibliotekë PDF; dëftesat/plani vjetor mbështeten te `window.print()`.
Pa PDF të nënshkruar/arkivuar, dëftesa/diploma nuk janë ligjërisht të
vlefshme. Mungon gjenerimi i certifikatës së klasës 5 dhe diplomës së
klasës 9 (enum-et ekzistojnë, UI jo).

### 2.5 🔴 Lënda "Fete dhe Kultura"
E seeduar për klasat 4–9. Edukimi fetar nuk është pjesë e kurrikulës zyrtare
publike në Kosovë (vendim 2010). **Zgjidhje:** hiqe nga seed-i dhe nga baza
(kujdes me të dhënat referente).

---

## 3. MANGËSI PËRPUTHSHMËRIE (prioritet i lartë)

- **Kompetencat & fushat kurrikulare (KKK):** s'ka gjurmim të 7 kompetencave
  kryesore, as grupim të lëndëve në 6 fushat kurrikulare, as Rezultate të të
  Nxënit (RNL). Kurrikula modelohet vetëm si lëndë.
- **Licencimi pa zbatim:** fushat (`license_*`, `professional_development`)
  ekzistojnë, por sistemi **nuk pengon** caktimin e mësuesit të
  palicencuar/të skaduar te `class_subjects`; s'ka alarm skadimi as minimum
  orësh ZHPM.
- **Mbrojtja e të dhënave – boshllëqe:** kërkesa e fshirjes pa **purge real**
  kur miratohet; audit log mbulim i pjesshëm (lexime të ndjeshme shpesh pa
  log; `ip_address` kurrë i mbushur; login/logout jo automatik); s'ka **DPO**;
  s'ka workflow **njoftimi shkeljeje te AIP** (Neni 7); 2FA opsionale.
- **Të dhëna shëndetësore jo të plota:** vetëm 1 kontakt emergjent (ligji
  kërkon 2+), pa fushë alergjish/vaksinimi/grup gjaku.
- **Pedagogu pa shënime konfidenciale:** `counseling_notes` nuk ekziston;
  duhet i ndarë nga notat me RLS rigoroze (vetëm pedagog + drejtor).

---

## 4. MODIFIKIME / SHTESA (prioritet i mesëm)

- **Gjuha e mësimit për klasë** (Neni 12): shto `language_of_instruction` te
  `classes`; `mother_tongue` ekziston te nxënësi.
- **Vlerësim nga bashkëmoshatari** dhe **provim përfundimtar/riprovim**
  (UA 06/2022) mungojnë.
- **Kalendari:** seed i festave zyrtare të Kosovës; sinkronizim me 3
  periudhat; validim brenda vitit shkollor.
- **Soft-delete & politika ruajtjeje** (Amza 75 vjet, nota 25 vjet) —
  pjesërisht; pa trigger arkivimi/afate.
- **Takimet me prindër:** gjurmim prezence; **PIA:** workflow rishikimi
  periodik; **akomodimet:** feedback efektiviteti nga mësuesi.
- **Lexime `USING(true)`** te `class_journal` dhe `school_calendar`: kufizim
  sipas shkollës (njëlloj si u bë te këshillat/testet).

---

## 5. ÇKA ËSHTË TASHMË NË PËRPUTHJE (verifikuar)

Shkalla 1–5 me CHECK; 3 periudhat; vlerësim përshkrues 1–2; diagnostik;
portofol; vetëvlerësim; **4 organet shkollore** me procesverbale; **NVA/PIA**
i plotë me pëlqim prindi & akomodime; **sjellja** (5 nivele) & **disiplina**
(5 masa me ndarje rolesh); **testet kombëtare V/IX**; **9 rolet** + hierarkia
komunë/DKA/ministri/inspektorat me RLS sipas shkollës; **pëlqimet** (6 lloje)
& kërkesat e fshirjes; **politika e privatësisë në 4 gjuhë**; aktivitetet
jashtëmësimore; biblioteka; **2FA (TOTP)**; **audit log** (me actor i
detyrueshëm pas forcimit qershor 2026); multi-shkollë.

---

## 6. ROADMAP ME PRIORITETE

### 🔴 Prioritet 1 — kritik (para përdorimit zyrtar)
1. RLS shëndetësor: ndarje e të dhënave mjekësore + kufizim same-school te leximi i mësuesit (§2.1)
2. Modul incidentesh/dhune (UA 13/2018) (§2.2)
3. Rakordim i plotë migracionesh repo↔bazë (§2.3 — nisur)
4. Gjenerim PDF + certifikatë/diplomë (§2.4)
5. Heqja e "Fete dhe Kultura" (§2.5)

### 🟠 Prioritet 2 — i lartë
6. Kompetencat/fushat/RNL të KKK
7. Zbatim i licencës te caktimi i mësuesit + alarm skadimi
8. DPO + njoftim shkeljeje + purge real fshirjeje + mbulim i plotë audit-i
9. Kontakt i 2-të emergjent + tabelë shëndetësore + `counseling_notes`

### 🟡 Prioritet 3 — i mesëm
10. Gjuha e mësimit për klasë
11. Provim përfundimtar/riprovim + peer assessment
12. Seed kalendari & festa; sinkronizim periudhash
13. Soft-delete/ruajtje; prezenca takimesh; kufizim `USING(true)`

---

## 7. PËRFUNDIM

Shkolla-Kos ka kaluar nga "fillim teknik" (~45%) në një sistem **kryesisht
funksional ligjërisht (~78%)**. Për përdorim **zyrtar të plotë** mbeten
Prioriteti 1 dhe 2 — sidomos mbrojtja e të dhënave të ndjeshme, raportimi i
incidenteve, dhe gjenerimi i dokumenteve zyrtare (PDF, certifikata, diploma).
Deri atëherë, sistemi përdoret mirë si platformë pune, por drejtori duhet të
ruajë paralelisht dokumentet zyrtare që sistemi ende nuk i lëshon në format
ligjor (dëftesë/diplomë e nënshkruar).

---

*I përgatitur më 16 Qershor 2026; zëvendëson auditin e 19 Majit 2026.*
