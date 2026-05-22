import { BookOpen, Download, Printer, Users, GraduationCap, User, Heart, Building, Crown, ClipboardCheck, ShieldCheck, School } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface RoleManual {
  role: string;
  icon: typeof Users;
  color: string;
  bg: string;
  title: string;
  intro: string;
  permissions: string[];
  workflows: { title: string; steps: string[] }[];
  legal: string[];
}

const MANUALS: RoleManual[] = [
  {
    role: 'super_admin',
    icon: ShieldCheck,
    color: 'text-zinc-700',
    bg: 'bg-zinc-100',
    title: 'Administrator i Sistemit',
    intro: 'Administratori i sistemit ka akses te metrika teknike, error logs, dhe konfigurimi i platformës. NUK ka akses te të dhënat e ministrisë, shkollave dhe nxënësve — ato janë private.',
    permissions: [
      'Monitorim i statusit të shërbimeve (Database, Auth, Storage, Realtime)',
      'Shikim i error logs dhe alerts të sistemit',
      'Menaxhim i homepage përmbajtjes dhe banner-eve publikë',
      'Konfigurim i politikave dhe kushteve të platformës',
      'Backup automatik dhe restore — vetëm monitorim',
      'Schema migrations — versionim',
      'Cilësimet globale: rate limits, MFA, 2FA',
    ],
    workflows: [
      {
        title: 'Monitorimi i shëndetit të sistemit',
        steps: [
          'Hyr te `/admin` — Paneli Kryesor',
          'Kontrollo statusin e 5 shërbimeve (PostgreSQL, Auth, Storage, Realtime, CI/CD)',
          'Shiko aktivitetet e fundit në panelin e djathtë',
          'Nëse ka alert, kliko mbi të për detaje në `/admin/logs`',
        ],
      },
      {
        title: 'Konfigurimi i politikave',
        steps: [
          'Hyr te `/admin/policies`',
          'Edito tekstin e Politikës së Privatësisë, Kushteve, Kodit të Sjelljes',
          'Klik "Ruaj" — ndryshimet shfaqen menjëherë te `/dokumentet-ligjore`',
        ],
      },
    ],
    legal: ['Ligji 06/L-082 (Mbrojtja e të Dhënave) — administratori NUK shkel privatësinë'],
  },
  {
    role: 'ministri',
    icon: Crown,
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    title: 'Ministri / MAShTI',
    intro: 'Ministri ka akses kombëtar te të gjitha 38 komunat, 102 shkollat dhe statistikat agregate. Krijon llogaritë e DKA-ve dhe Inspektorëve.',
    permissions: [
      'Pamje e statistikave kombëtare (përdorues, shkolla, mësues, nxënës)',
      'Krijim i llogarive DKA, Inspektorëve, dhe Drejtorëve të shkollave',
      'Menaxhim i komunave dhe shkollave në nivel kombëtar',
      'Audit log i të gjitha veprimeve të sistemit',
      'Caktim i komunës që menaxhon çdo DKA',
    ],
    workflows: [
      {
        title: 'Krijim i një DKA të ri',
        steps: [
          'Hyr te `/ministri/stafi`',
          'Klik "Krijo Llogari"',
          'Plotëso: emër, mbiemër, email, telefon',
          'Zgjidh rolin "Drejtor Komunal"',
          'Zgjidh komunën që do menaxhojë',
          'Klik "Ruaj" → kredencialet shfaqen, ndaji me DKA-në',
          'PËRDORUESI: kërkohet konfirmimi i emailit (kontrollo Supabase cilësimet)',
        ],
      },
      {
        title: 'Shikim i statistikave kombëtare',
        steps: [
          'Hyr te `/ministri` — paneli kryesor',
          'Shiko 10 stat cards: komunat, shkollat, nxënësit, mësuesit, prindërit',
          'Eksploro grafikët: nxënësit sipas komunave, shkollat sipas rajonit',
          'Klik mbi një komunë në tabelën fund të faqes për detaje',
        ],
      },
    ],
    legal: ['Ligji 04/L-032 (Arsimi Parauniversitar)', 'Ligji 03/L-068 (Arsimi në Komunat)'],
  },
  {
    role: 'drejtor_komunal',
    icon: Building,
    color: 'text-amber-700',
    bg: 'bg-amber-100',
    title: 'Drejtor Komunal (DKA)',
    intro: 'DKA menaxhon shkollat brenda komunës së vet. Mund të shtojë shkolla të reja, të krijojë llogari drejtorësh, dhe të monitorojë statistikat komunale.',
    permissions: [
      'Shikim i të gjitha shkollave të komunës',
      'Krijim i shkollave të reja',
      'Caktim i drejtorëve për shkolla të reja',
      'Statistika komunale',
      'Komunikim me Ministrinë dhe Inspektoratin',
    ],
    workflows: [
      {
        title: 'Shtim i një shkolle dhe drejtori',
        steps: [
          'Hyr te `/dka/shkollat`',
          'Klik "Shto Shkollë"',
          'Plotëso: emri, tipi (fillore/mesme), adresa, vendbanimi',
          'Aktivizo "Krijo gjithashtu llogarinë e drejtorit"',
          'Plotëso emrin dhe email-in e drejtorit',
          'Klik "Krijo" → ruaj kredencialet që shfaqen',
          'Ndaji kredencialet me drejtorin përmes kanali të sigurt',
        ],
      },
    ],
    legal: ['Ligji 03/L-068 (Arsimi në Komunat), Neni 5'],
  },
  {
    role: 'inspektor',
    icon: ClipboardCheck,
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    title: 'Inspektor i Arsimit',
    intro: 'Inspektori kryen inspektimet shkollore sipas Ligjit 06/L-046. Cakton inspektime, regjistron gjetje, jep rekomandime, dhe ndjek implementimin.',
    permissions: [
      'Shikim i të gjitha shkollave të Kosovës',
      'Krijim i inspektimeve dhe caktim i datave',
      'Regjistrim i gjetjeve me ashpërsi',
      'Rekomandime për përmirësim',
      'Ndjekje e statusit (e planifikuar / në vazhdim / e përfunduar)',
      'Komunikim me DKA dhe MAShTI',
    ],
    workflows: [
      {
        title: 'Inspektim i ri shkollor',
        steps: [
          'Hyr te `/inspektor/inspektimet`',
          'Klik "Inspektim i Ri"',
          'Zgjidh shkollën, datën, tipin e inspektimit',
          'Plotëso fokuset e inspektimit (akademik, infrastrukturor, etj.)',
          'Klik "Krijo"',
          'Pas vizitës: kliko mbi inspektimin → shto gjetjet dhe rekomandimet',
          'Ndrysho statusin në "E përfunduar"',
        ],
      },
    ],
    legal: ['Ligji 06/L-046 (Inspektorati i Arsimit)'],
  },
  {
    role: 'drejtor',
    icon: School,
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    title: 'Drejtor i Shkollës',
    intro: 'Drejtori menaxhon plotësisht shkollën: nxënësit, mësuesit, prindërit, klasat, lëndët, oraret. Lëshon dëftesa zyrtare dhe gjeneron raporte.',
    permissions: [
      'Menaxhim i plotë i shkollës (Ligji 04/L-032, Neni 22)',
      'Krijim i llogarive për mësues, nxënës, prindër, pedagogë',
      'Caktim i klasave dhe lëndëve',
      'Verifikim i orëve ZHPM të mësuesve',
      'Lëshim i dëftesave zyrtare',
      'Aprovim/Refuzim i kërkesave për fshirjen e të dhënave (Ligji 06/L-082)',
      'Plani Vjetor i Shkollës',
      'Inspektimet e marra',
    ],
    workflows: [
      {
        title: 'Krijim i një mësuesi të ri',
        steps: [
          'Hyr te `/drejtor/mesues`',
          'Klik "Shto Mësues"',
          'Plotëso: emër, mbiemër, email, telefon',
          'Klik "Ruaj" → kredencialet shfaqen',
          'Kopjo ose dërgo me email tek mësuesi',
          'PROBLEM I NJOHUR: nëse email confirmation është ON në Supabase, mësuesi duhet të klikojë linkun në email para se të mund të identifikohet. Për prodhim, çaktivizo "Confirm email" te Supabase Auth.',
        ],
      },
      {
        title: 'Caktim i mësuesve në klasa dhe lëndë',
        steps: [
          'Hyr te `/drejtor/klasa`',
          'Zgjidh klasën',
          'Klik "Cakto mësues për lëndët"',
          'Për çdo lëndë, zgjidh mësuesin përkatës',
          'Klik "Ruaj"',
        ],
      },
      {
        title: 'Lëshim i dëftesës zyrtare',
        steps: [
          'Hyr te `/drejtor/deftesat`',
          'Zgjidh klasën dhe periudhën',
          'Klik "Gjenero Dëftesa"',
          'Shqyrto çdo dëftesë',
          'Klik "Lësho Zyrtarisht" për ta bërë oficiale',
          'Dëftesa printohet automatikisht dhe gjenerohet PDF',
        ],
      },
    ],
    legal: ['Ligji 04/L-032 (Arsimi Parauniversitar)', 'UA 19/2018 (Dokumentacioni Pedagogjik)'],
  },
  {
    role: 'pedagog',
    icon: Heart,
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    title: 'Pedagog (Psikolog / Logoped)',
    intro: 'Pedagogu ofron mbështetje psiko-sociale, vlerëson nevojat e veçanta arsimore (NVA), krijon Plane Individuale të Arsimit (PIA), dhe ndjek portofolet e nxënësve.',
    permissions: [
      'Vlerësim diagnostikues i nxënësve (UA 06/2022)',
      'Krijim dhe menaxhim i Planeve Individuale të Arsimit (PIA)',
      'Identifikim i nevojave të veçanta arsimore',
      'Portofoli i nxënësve',
      'Anëtarësi në Këshillin Pedagogjik',
      'Takime me prindër për nxënësit me NVA',
    ],
    workflows: [
      {
        title: 'Krijim i një PIA për nxënës me NVA',
        steps: [
          'Hyr te `/pedagog/nva`',
          'Zgjidh nxënësin që ka nevojë të veçantë',
          'Klik "Shto NVA" — plotëso kategorinë (autizëm, dislexi, etj.) dhe ashpërsinë',
          'Pastaj klik "Krijo PIA"',
          'Plotëso objektivat sipas fushave (akademike, sociale, emocionale)',
          'Shto akomodimet (kohë e zgjatur, mbështetje vizuale, etj.)',
          'Ruaj — prindi do të marrë njoftim për të dhënë pëlqimin',
        ],
      },
    ],
    legal: ['Ligji 04/L-032, Neni 40 (Arsimi Gjithëpërfshirës)', 'UA 06/2022 (Vlerësimi)'],
  },
  {
    role: 'mesues',
    icon: GraduationCap,
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    title: 'Mësues',
    intro: 'Mësuesi vlerëson nxënësit, regjistron frekuentimin dhe sjelljen, mban ditarin e klasës, dhe komunikon me prindërit.',
    permissions: [
      'Regjistrim i notave (sistemi 1-5)',
      'Regjistrim i frekuentimit ditor',
      'Vlerësim i sjelljes (UA 06/2022 — përshkrues)',
      'Ditari i klasës (UA 19/2018)',
      'Detyrat e shtëpisë',
      'Vlerësim diagnostikues',
      'Takime me prindër',
      'Akomodime për nxënësit me NVA',
      'Licenca ime + ZHPM (100 orë/5 vjet)',
    ],
    workflows: [
      {
        title: 'Regjistrim i notave për një klasë',
        steps: [
          'Hyr te `/mesues/nota`',
          'Zgjidh klasën dhe lëndën që jep',
          'Zgjidh periudhën (1, 2, ose 3)',
          'Për çdo nxënës, vendos notat V1-V4 dhe Përfundimtare',
          'Klik "Ruaj Notat" — prindi merr njoftim automatik',
        ],
      },
      {
        title: 'Regjistrim i frekuentimit ditor',
        steps: [
          'Hyr te `/mesues/frekuentimi`',
          'Zgjidh klasën dhe lëndën',
          'Konfirmo datën (default sot)',
          'Për çdo nxënës klik statusin: Prezent / Mungon / Vonesë / Arsyeshme',
          'Klik "Ruaj Të Gjitha"',
        ],
      },
    ],
    legal: ['UA 06/2022 (Vlerësimi)', 'UA 19/2018 (Dokumentacioni)', 'UA 05/2017 (ZHPM)'],
  },
  {
    role: 'nxenes',
    icon: User,
    color: 'text-cyan-700',
    bg: 'bg-cyan-100',
    title: 'Nxënës',
    intro: 'Nxënësi shikon notat e veta, orarin javor, mungesat, portofolin, dhe rezultatet e Testeve Kombëtare.',
    permissions: [
      'Pamje e notave të veta',
      'Orari javor',
      'Frekuentimi i veta (mungesat dhe prezenca)',
      'Vetëvlerësimi (UA 06/2022)',
      'Portofoli — punimet dhe arritjet',
      'Mesazhe me mësuesin',
      'Rezultatet e Testit të Arritshmërisë (Klasa V dhe IX)',
    ],
    workflows: [
      {
        title: 'Krijim i një vetëvlerësimi',
        steps: [
          'Hyr te `/nxenes/vetëvlerësimi`',
          'Klik "Vetëvlerësim i ri"',
          'Zgjidh lëndën dhe nivelin (shkëlqyeshëm / mirë / etj.)',
          'Plotëso: çfarë mësova, çfarë duhet të përmirësoj, synimet',
          'Klik "Ruaj"',
        ],
      },
    ],
    legal: ['UA 06/2022 (Vetëvlerësimi)'],
  },
  {
    role: 'prind',
    icon: Users,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    title: 'Prind',
    intro: 'Prindi ndjek ecurinë e fëmijës: notat, mungesat, sjelljen, PIA (nëse ka NVA), takimet, dhe menaxhon pëlqimet e privatësisë.',
    permissions: [
      'Pamje e notave të fëmijës',
      'Frekuentimi i fëmijës',
      'Arsyetim i mungesave',
      'Plani Individual i Arsimit (PIA) i fëmijës — kërkohet pëlqimi',
      'Komunikim me mësuesin',
      'Pëlqimet e privatësisë (Ligji 06/L-082)',
      'E drejta e harresës — kërkesë për fshirjen e të dhënave',
    ],
    workflows: [
      {
        title: 'Dërgim i arsyetimit për mungesë',
        steps: [
          'Hyr te `/prind/frekuentimi`',
          'Klik "Dorëzo Arsyetim"',
          'Zgjidh datat (nga / deri)',
          'Plotëso arsyen',
          'Klik "Dërgo" — drejtori do ta shqyrtojë',
        ],
      },
      {
        title: 'Dhënia e pëlqimit për PIA',
        steps: [
          'Hyr te `/prind/pia`',
          'Shfaqet PIA i fëmijës me objektivat',
          'Shqyrto detajet',
          'Klik "Jap Pëlqimin për Planin"',
          'Pëlqimi regjistrohet me datën dhe regjistrimi mbahet në audit log',
        ],
      },
    ],
    legal: ['Ligji 04/L-032 (PIA me pëlqim prindi)', 'Ligji 06/L-082 (Të dhënat personale)'],
  },
];

function printManual() {
  window.print();
}

function downloadAsHtml() {
  const html = document.getElementById('user-manual')?.outerHTML;
  if (!html) return;
  const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Manual i Përdorimit — Shkolla-Kos</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:40px;color:#1e293b;max-width:900px;margin:0 auto;line-height:1.6}
  h1{font-size:28px;border-bottom:3px solid #2563eb;padding-bottom:8px}
  h2{font-size:22px;color:#1e40af;margin-top:32px}
  h3{font-size:16px;color:#475569;margin-top:20px}
  ul,ol{padding-left:24px}
  li{margin:4px 0}
  .role-card{border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:16px 0;page-break-inside:avoid}
  .intro{background:#f1f5f9;padding:12px;border-radius:8px;font-style:italic}
  .legal{font-size:12px;color:#64748b;margin-top:12px}
  @media print{body{padding:20px}.role-card{page-break-inside:avoid}}
</style></head><body>${html}</body></html>`;
  const blob = new Blob([full], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Manual-Shkolla-Kos.html';
  a.click();
  URL.revokeObjectURL(url);
}

export default function UserManual() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">{t('manual.title')}</h1>
            <p className="text-blue-100 text-sm">{t('manual.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadAsHtml}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {t('manual.download_html')}
          </button>
          <button
            onClick={printManual}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium"
          >
            <Printer className="w-4 h-4" />
            {t('manual.print_pdf')}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900 print:hidden">
        <strong>{t('manual.tip_label')}:</strong> {t('manual.tip_help')}
      </div>

      <div id="user-manual" className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('manual.title')}</h1>
          <p className="text-slate-600 mb-4">{t('manual.intro')}</p>
          <p className="text-xs text-slate-500">
            {t('manual.updated_label')}: {new Date().toLocaleDateString('sq-AL')} · Shkolla-Kos v1.0
          </p>
        </div>

        {MANUALS.map((m) => (
          <div key={m.role} className="role-card bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">{m.title}</h2>
            </div>

            <div className="intro bg-slate-50 rounded-lg p-3 text-sm text-slate-700 italic mb-4">
              {m.intro}
            </div>

            <h3 className="font-semibold text-slate-900 mt-4 mb-2">{t('manual.permissions')}</h3>
            <ul className="list-disc pl-6 text-sm text-slate-700 space-y-1">
              {m.permissions.map((p, i) => <li key={i}>{p}</li>)}
            </ul>

            <h3 className="font-semibold text-slate-900 mt-4 mb-2">{t('manual.workflows')}</h3>
            {m.workflows.map((wf, i) => (
              <div key={i} className="mt-3">
                <p className="font-medium text-slate-800 text-sm">{wf.title}</p>
                <ol className="list-decimal pl-6 text-sm text-slate-700 space-y-0.5 mt-1">
                  {wf.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            ))}

            {m.legal.length > 0 && (
              <div className="legal mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <strong>{t('manual.legal_basis')}:</strong> {m.legal.join(' · ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
