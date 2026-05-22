import { useParams, Link } from 'react-router-dom';
import { BookOpen, Users, GraduationCap, User, Heart, Building, Crown, ClipboardCheck, ShieldCheck, School, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface RoleGuide {
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

const GUIDES: Record<string, RoleGuide> = {
  super_admin: {
    role: 'super_admin', icon: ShieldCheck, color: 'text-zinc-700', bg: 'bg-zinc-100',
    title: 'Administrator i Sistemit',
    intro: 'Mbikëqyr shëndetin teknik të platformës — error logs, backups, migrations, politikat. NUK ka akses te të dhënat e ministrisë/shkollave/nxënësve.',
    permissions: [
      'Monitorim i statusit të shërbimeve (Database, Auth, Storage, Realtime, CI/CD)',
      'Shikim i alerts dhe error logs',
      'Menaxhim i homepage përmbajtjes',
      'Konfigurim i politikave dhe kushteve',
      'Schema migrations dhe backup status',
    ],
    workflows: [
      { title: 'Monitorimi i shëndetit të sistemit', steps: ['Hyr te /admin', 'Kontrollo statusin e 5 shërbimeve', 'Shiko aktivitetet e fundit', 'Klik mbi alert për detaje në /admin/logs'] },
    ],
    legal: ['Ligji 06/L-082 (Mbrojtja e të Dhënave) — privacy by design'],
  },
  ministri: {
    role: 'ministri', icon: Crown, color: 'text-purple-700', bg: 'bg-purple-100',
    title: 'Ministri / MAShTI',
    intro: 'Pamje kombëtare e 38 komunave, 102 shkollave dhe statistikave agregate. Krijon llogaritë e DKA-ve dhe Inspektorëve.',
    permissions: [
      'Statistika kombëtare (përdorues, shkolla, mësues, nxënës)',
      'Krijim i llogarive DKA, Inspektorëve, Drejtorëve',
      'Menaxhim i komunave dhe shkollave',
      'Audit log i të gjithë sistemit',
      'Caktim i komunës që menaxhon çdo DKA',
    ],
    workflows: [
      {
        title: 'Krijim i një DKA të ri',
        steps: [
          'Hyr te /ministri/stafi',
          'Klik "Krijo Llogari"',
          'Plotëso: emër, mbiemër, email, telefon',
          'Zgjidh rolin "Drejtor Komunal"',
          'Zgjidh komunën që do menaxhojë',
          'Klik "Ruaj" — kopjo kredencialet',
          'KUJDES: Verifikoni te Supabase Dashboard nëse "Confirm email" është OFF. Përndryshe DKA duhet të konfirmojë email-in para login.',
        ],
      },
      {
        title: 'Pamje e statistikave kombëtare',
        steps: ['Hyr te /ministri — paneli kryesor', 'Shiko 10 stat cards', 'Eksploro grafikët (Top 8 komuna)', 'Klik mbi komunë për detaje'],
      },
    ],
    legal: ['Ligji 04/L-032 (Arsimi Parauniversitar)', 'Ligji 03/L-068 (Arsimi në Komunat)'],
  },
  drejtor_komunal: {
    role: 'drejtor_komunal', icon: Building, color: 'text-amber-700', bg: 'bg-amber-100',
    title: 'Drejtor Komunal (DKA)',
    intro: 'Menaxhon shkollat e komunës. Shton shkolla të reja, krijon llogari drejtorësh, monitoron statistikat komunale.',
    permissions: [
      'Të gjitha shkollat e komunës',
      'Krijim i shkollave të reja',
      'Caktim i drejtorëve për shkolla',
      'Statistika komunale',
      'Komunikim me Ministrinë dhe Inspektoratin',
    ],
    workflows: [
      {
        title: 'Shtim i një shkolle + drejtori',
        steps: [
          'Hyr te /dka/shkollat',
          'Klik "Shto Shkollë"',
          'Plotëso: emri, tipi, adresa, vendbanimi',
          'Aktivizo "Krijo gjithashtu llogarinë e drejtorit"',
          'Plotëso emrin dhe email-in e drejtorit',
          'Klik "Krijo" — ruaj kredencialet',
          'Ndaji kredencialet me drejtorin përmes email-i të sigurt',
        ],
      },
    ],
    legal: ['Ligji 03/L-068, Neni 5'],
  },
  inspektor: {
    role: 'inspektor', icon: ClipboardCheck, color: 'text-orange-700', bg: 'bg-orange-100',
    title: 'Inspektor i Arsimit',
    intro: 'Kryen inspektime shkollore. Cakton inspektime, regjistron gjetje, jep rekomandime, dhe ndjek implementimin.',
    permissions: [
      'Shikim i të gjitha shkollave',
      'Krijim dhe planifikim i inspektimeve',
      'Regjistrim i gjetjeve me ashpërsi',
      'Rekomandime për përmirësim',
      'Ndjekje statusi: e planifikuar / në vazhdim / e përfunduar',
    ],
    workflows: [
      {
        title: 'Inspektim i ri shkollor',
        steps: [
          'Hyr te /inspektor/inspektimet',
          'Klik "Inspektim i Ri"',
          'Zgjidh shkollën, datën, tipin',
          'Plotëso fokuset (akademik, infrastrukturor, etj.)',
          'Klik "Krijo"',
          'Pas vizitës: kliko inspektimin → shto gjetjet + rekomandimet',
          'Ndrysho statusin në "E përfunduar"',
        ],
      },
    ],
    legal: ['Ligji 06/L-046 (Inspektorati i Arsimit)'],
  },
  drejtor: {
    role: 'drejtor', icon: School, color: 'text-blue-700', bg: 'bg-blue-100',
    title: 'Drejtor i Shkollës',
    intro: 'Menaxhon plotësisht shkollën: nxënësit, mësuesit, prindërit, klasat, lëndët, oraret. Lëshon dëftesa zyrtare.',
    permissions: [
      'Menaxhim i plotë i shkollës',
      'Krijim i mësuesve, nxënësve, prindërve, pedagogëve',
      'Caktim i klasave dhe lëndëve',
      'Verifikim i orëve ZHPM',
      'Lëshim i dëftesave zyrtare',
      'Aprovim/Refuzim i kërkesave të fshirjes (GDPR)',
      'Plani Vjetor i Shkollës',
    ],
    workflows: [
      {
        title: 'Krijim i një mësuesi të ri',
        steps: [
          'Hyr te /drejtor/mesues',
          'Klik "Shto Mësues"',
          'Plotëso: emër, mbiemër, email, telefon',
          'Klik "Ruaj" — kredencialet shfaqen',
          'Kopjo ose dërgo te mësuesi',
          'KUJDES: Nëse mësuesi nuk mund të bëjë login, verifikoni:',
          ' 1) Supabase Dashboard → Auth → "Confirm email" duhet të jetë OFF',
          ' 2) Ose mësuesi duhet të klikojë linkun në email për ta konfirmuar',
        ],
      },
      {
        title: 'Caktim i mësuesve në klasa',
        steps: ['Hyr te /drejtor/klasa', 'Zgjidh klasën', 'Klik "Cakto mësues për lëndët"', 'Për çdo lëndë, zgjidh mësuesin', 'Klik "Ruaj"'],
      },
      {
        title: 'Lëshim i dëftesës zyrtare',
        steps: ['Hyr te /drejtor/deftesat', 'Zgjidh klasën dhe periudhën', 'Klik "Gjenero Dëftesa"', 'Shqyrto çdo dëftesë', 'Klik "Lësho Zyrtarisht"', 'Printo ose ruaj si PDF'],
      },
    ],
    legal: ['Ligji 04/L-032, Neni 22', 'UA 19/2018 (Dokumentacioni Pedagogjik)'],
  },
  pedagog: {
    role: 'pedagog', icon: Heart, color: 'text-pink-700', bg: 'bg-pink-100',
    title: 'Pedagog (Psikolog / Logoped)',
    intro: 'Mbështetje psiko-sociale, vlerësim i NVA-ve, krijim i PIA-ve, dhe ndjekje e portofoleve.',
    permissions: [
      'Vlerësim diagnostikues',
      'Krijim dhe menaxhim i PIA-ve',
      'Identifikim i nevojave të veçanta',
      'Portofoli i nxënësve',
      'Anëtarësi në Këshillin Pedagogjik',
      'Takime me prindër për nxënësit me NVA',
    ],
    workflows: [
      {
        title: 'Krijim i PIA-së për një nxënës me NVA',
        steps: [
          'Hyr te /pedagog/nva',
          'Zgjidh nxënësin',
          'Klik "Shto NVA" — kategoria + ashpërsia',
          'Klik "Krijo PIA"',
          'Plotëso objektivat (akademike, sociale, emocionale)',
          'Shto akomodimet (kohë e zgjatur, mbështetje vizuale, etj.)',
          'Ruaj — prindi merr njoftim për pëlqim',
        ],
      },
    ],
    legal: ['Ligji 04/L-032, Neni 40', 'UA 06/2022 (Vlerësimi)'],
  },
  mesues: {
    role: 'mesues', icon: GraduationCap, color: 'text-teal-700', bg: 'bg-teal-100',
    title: 'Mësues',
    intro: 'Vlerëson nxënësit, regjistron frekuentimin dhe sjelljen, mban ditarin e klasës, komunikon me prindërit.',
    permissions: [
      'Regjistrim notash (1-5)',
      'Frekuentim ditor',
      'Vlerësim sjelljeje (UA 06/2022)',
      'Ditari i klasës (UA 19/2018)',
      'Detyrat e shtëpisë',
      'Takime me prindër',
      'Akomodime për nxënësit me NVA',
      'Licenca + ZHPM (100h / 5 vjet)',
    ],
    workflows: [
      {
        title: 'Regjistrim i notave për klasë',
        steps: ['Hyr te /mesues/nota', 'Zgjidh klasën dhe lëndën', 'Zgjidh periudhën (1/2/3)', 'Vendos V1-V4 + Përfundimtare', 'Klik "Ruaj Notat"'],
      },
      {
        title: 'Regjistrim i frekuentimit',
        steps: ['Hyr te /mesues/frekuentimi', 'Zgjidh klasën + lëndën', 'Konfirmo datën', 'Klik statusin për çdo nxënës', 'Klik "Ruaj Të Gjitha"'],
      },
    ],
    legal: ['UA 06/2022', 'UA 19/2018', 'UA 05/2017 (ZHPM)'],
  },
  nxenes: {
    role: 'nxenes', icon: User, color: 'text-cyan-700', bg: 'bg-cyan-100',
    title: 'Nxënës',
    intro: 'Shikon notat, orarin javor, mungesat, portofolin, dhe rezultatet e Testeve Kombëtare.',
    permissions: [
      'Pamje e notave',
      'Orari javor',
      'Frekuentimi i veta',
      'Vetëvlerësimi',
      'Portofoli',
      'Mesazhe me mësuesin',
      'Rezultatet e Testit të Arritshmërisë (V dhe IX)',
    ],
    workflows: [
      {
        title: 'Krijim i një vetëvlerësimi',
        steps: ['Hyr te /nxenes/vetëvlerësimi', 'Klik "Vetëvlerësim i ri"', 'Zgjidh lëndën dhe nivelin', 'Plotëso: çfarë mësova, çfarë duhet të përmirësoj, synimet', 'Klik "Ruaj"'],
      },
    ],
    legal: ['UA 06/2022 (Vetëvlerësimi)'],
  },
  prind: {
    role: 'prind', icon: Users, color: 'text-slate-700', bg: 'bg-slate-100',
    title: 'Prind',
    intro: 'Ndjek ecurinë e fëmijës: notat, mungesat, sjelljen, PIA. Menaxhon pëlqimet e privatësisë.',
    permissions: [
      'Notat e fëmijës',
      'Frekuentimi i fëmijës',
      'Arsyetim mungesash',
      'PIA i fëmijës (kërkohet pëlqimi)',
      'Komunikim me mësuesin',
      'Pëlqimet e privatësisë (GDPR)',
      'E drejta e harresës',
    ],
    workflows: [
      {
        title: 'Dërgim i arsyetimit për mungesë',
        steps: ['Hyr te /prind/frekuentimi', 'Klik "Dorëzo Arsyetim"', 'Zgjidh datat (nga / deri)', 'Plotëso arsyen', 'Klik "Dërgo"'],
      },
      {
        title: 'Dhënia e pëlqimit për PIA',
        steps: ['Hyr te /prind/pia', 'Shqyrto detajet e planit', 'Klik "Jap Pëlqimin për Planin"', 'Pëlqimi regjistrohet me datë + audit log'],
      },
    ],
    legal: ['Ligji 04/L-032', 'Ligji 06/L-082'],
  },
};

export default function RoleGuide() {
  const { role } = useParams<{ role: string }>();
  const { t } = useI18n();
  const guide = role && GUIDES[role];

  if (!guide) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/dokumentet-ligjore" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t('rmd.back_to_docs')}
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">{t('page.not_found_title')}</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = guide.icon;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/dokumentet-ligjore" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          {t('rmd.back_to_docs')}
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${guide.bg} rounded-2xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${guide.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{guide.title}</h1>
              <p className="text-slate-500 text-sm">{t('rmd.role_docs_title')}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-900">{guide.intro}</p>
          </div>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{t('manual.permissions')}</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              {guide.permissions.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">{t('manual.workflows')}</h2>
            {guide.workflows.map((wf, i) => (
              <div key={i} className="mt-4 bg-slate-50 rounded-xl p-4">
                <p className="font-semibold text-slate-900 text-sm mb-2">{wf.title}</p>
                <ol className="list-decimal pl-6 text-sm text-slate-700 space-y-1">
                  {wf.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            ))}
          </section>

          {guide.legal.length > 0 && (
            <section className="mt-6 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-2">{t('manual.legal_basis')}</h2>
              <p className="text-xs text-slate-600">{guide.legal.join(' · ')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
