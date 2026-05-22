import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Shield, FileText, Heart, AlertTriangle, Cookie, ArrowLeft, Mail } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import type { TranslationKey } from '../../lib/i18n/translations';

type DocId = 'privacy' | 'terms' | 'child_protection' | 'code_of_conduct' | 'cookies';

interface DocSection {
  id: DocId;
  titleKey: TranslationKey;
  icon: typeof Shield;
  color: string;
  legalKey: TranslationKey;
  updated: string;
}

const DOCS: DocSection[] = [
  {
    id: 'privacy',
    titleKey: 'ld.doc_privacy',
    icon: Shield,
    color: 'bg-blue-100 text-blue-700',
    legalKey: 'ld.legal_privacy',
    updated: '19 Maj 2026',
  },
  {
    id: 'terms',
    titleKey: 'ld.doc_terms',
    icon: FileText,
    color: 'bg-purple-100 text-purple-700',
    legalKey: 'ld.legal_terms',
    updated: '19 Maj 2026',
  },
  {
    id: 'child_protection',
    titleKey: 'ld.doc_child_protection',
    icon: Heart,
    color: 'bg-rose-100 text-rose-700',
    legalKey: 'ld.legal_child',
    updated: '19 Maj 2026',
  },
  {
    id: 'code_of_conduct',
    titleKey: 'ld.doc_code_of_conduct',
    icon: AlertTriangle,
    color: 'bg-amber-100 text-amber-700',
    legalKey: 'ld.legal_conduct',
    updated: '19 Maj 2026',
  },
  {
    id: 'cookies',
    titleKey: 'ld.doc_cookies',
    icon: Cookie,
    color: 'bg-emerald-100 text-emerald-700',
    legalKey: 'ld.legal_cookies',
    updated: '19 Maj 2026',
  },
];

export default function LegalDocuments() {
  const { t, language } = useI18n();
  const [active, setActive] = useState<DocId>('privacy');
  const current = DOCS.find((d) => d.id === active)!;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('btn.back')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('ld.title')}</h1>
              <p className="text-slate-500">{t('ld.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="space-y-1">
            {DOCS.map((d) => {
              const Icon = d.icon;
              const isActive = active === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setActive(d.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-start gap-3 ${
                    isActive ? 'bg-white border-2 border-blue-500 shadow-sm' : 'bg-white border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${d.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>{t(d.titleKey)}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Content */}
          <main className="md:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 md:p-10">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl ${current.color} flex items-center justify-center`}>
                <current.icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t(current.titleKey)}</h2>
                <p className="text-xs text-slate-500">{t('ld.based_on')} {t(current.legalKey)} · {t('ld.updated_label')} {current.updated}</p>
              </div>
            </div>

            {language !== 'sq' && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-900">
                {t('ld.legal_text_note')}
              </div>
            )}

            <div className="prose prose-slate max-w-none mt-6 text-sm">
              {active === 'privacy' && <PrivacyContent />}
              {active === 'terms' && <TermsContent />}
              {active === 'child_protection' && <ChildProtectionContent />}
              {active === 'code_of_conduct' && <CodeOfConductContent />}
              {active === 'cookies' && <CookiesContent />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function PrivacyContent() {
  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-blue-900">
        Sistemi përpunon të dhëna të fëmijëve të mitur — kategoria më e ndjeshme. Ky dokument shpjegon
        mënyrën e përpunimit sipas <strong>Ligjit Nr. 06/L-082 për Mbrojtjen e të Dhënave Personale</strong>.
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">1. Çfarë të dhënash mbledhim</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Identifikuese:</strong> emër, mbiemër, numri personal, datëlindja, vendlindja, gjinia, adresa</li>
        <li><strong>Kontakte:</strong> email, telefon, kontakt emergjent</li>
        <li><strong>Kujdestaria:</strong> emri i kujdestarit ligjor dhe lidhja familjare</li>
        <li><strong>Akademike:</strong> notat, frekuentimi, sjellja, masat disiplinore, orari</li>
        <li><strong>Mjekësore bazike:</strong> vetëm me pëlqimin tuaj, për sigurinë e fëmijës</li>
        <li><strong>Teknike:</strong> hyrjet në sistem (kohë, IP, browser) për auditim sigurie</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">2. Bazat ligjore të përpunimit</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Detyrimi ligjor sipas Ligjit 04/L-032 për Arsimin Parauniversitar</li>
        <li>Mbajtja e Amzës dhe dokumentacionit pedagogjik (UA 19/2018)</li>
        <li>Lëshimi i dëftesave, certifikatave dhe diplomave zyrtare</li>
        <li>Mbrojtja e fëmijës (kontakti emergjent, kushtet mjekësore)</li>
        <li>Pëlqimi i shprehur i prindit për kategori specifike</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">3. Të drejtat tuaja</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Qasja:</strong> të shihni të gjitha të dhënat që mbahen</li>
        <li><strong>Korrigjimi:</strong> të saktësoni të dhënat e pasakta</li>
        <li><strong>Harresa:</strong> të kërkoni fshirjen kur baza ligjore nuk ekziston më</li>
        <li><strong>Kufizimi:</strong> të kufizoni përpunimin për qëllime specifike</li>
        <li><strong>Kundërshtimi:</strong> të kundërshtoni përpunimin që nuk është ligjor</li>
        <li><strong>Portabiliteti:</strong> të merrni një kopje në format të lexueshëm</li>
      </ul>
      <p className="mt-2 text-slate-600">
        Të drejtat ushtrohen përmes panelit "Privatësia" te llogaria juaj e prindit, ose me kërkesë te drejtoria.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">4. Periudha e ruajtjes</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Amza: ruajtje e përhershme (detyrim ligjor)</li>
        <li>Dëftesa dhe diploma: 75 vjet</li>
        <li>Notat dhe frekuentimi: 25 vjet</li>
        <li>Mesazhet: 5 vjet</li>
        <li>Audit logs: 2 vjet</li>
        <li>Pëlqimet: zgjatja e marrëdhënies + 5 vjet</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">5. Siguria</h3>
      <p className="text-slate-700">
        Lidhje e enkriptuar (HTTPS), enkriptim i të dhënave në bazë (PostgreSQL/Supabase), Row-Level Security
        në çdo tabelë, audit log për qasje të ndjeshme, autentifikim me dy faktorë (2FA) për stafin, sesione
        me skadim automatik.
      </p>

      <ContactBox />
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">1. Pranimi i Kushteve</h3>
      <p className="text-slate-700">
        Duke përdorur platformën Shkolla Kos, ju pranoni këto kushte. Nëse nuk pajtoheni, nuk duhet
        ta përdorni platformën.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">2. Përdoruesit e autorizuar</h3>
      <p className="text-slate-700">Platforma është e dedikuar për:</p>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Drejtorin e shkollës</li>
        <li>Mësimdhënësit e licencuar dhe stafin pedagogjik (psikolog, logoped, pedagog)</li>
        <li>Nxënësit e klasave 1–9</li>
        <li>Prindërit ose kujdestarët ligjorë</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">3. Përdorimi i pranueshëm</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Mos përdor llogarinë tënde për qëllime jashtë rolit shkollor</li>
        <li>Mos ndaj kredencialet me askënd</li>
        <li>Mos shkarko ose kopjo të dhëna pa autorizim</li>
        <li>Mos përdor sistemin për të kërcënuar, ngacmuar ose dëmtuar të tjerët</li>
        <li>Respekto privatësinë e të dhënave të nxënësve</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">4. Përgjegjësia për kredencialet</h3>
      <p className="text-slate-700">
        Përdoruesi është përgjegjës për mbajtjen e sigurt të fjalëkalimit. Rekomandohet aktivizimi i 2FA.
        Çdo veprim i kryer me llogarinë tuaj konsiderohet i kryer nga ju.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">5. Disponueshmëria e shërbimit</h3>
      <p className="text-slate-700">
        Përpiqemi të mbajmë platformën të disponueshme 24/7, por nuk garantojmë mungesë absolute të
        ndërprerjeve për mirëmbajtje, përditësime ose probleme teknike.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">6. Pronësia intelektuale</h3>
      <p className="text-slate-700">
        Përmbajtja e platformës (kodi, dizajni, materiali edukativ) është pronë e shkollës dhe e
        zhvilluesve. Nuk lejohet kopjimi ose ridistribuimi pa leje.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">7. Pezullimi dhe mbyllja</h3>
      <p className="text-slate-700">
        Drejtori i shkollës mund të pezullojë ose mbyllë çdo llogari në rast të shkeljes së këtyre kushteve
        ose në rast të largimit të përdoruesit nga shkolla.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">8. Ndryshimet</h3>
      <p className="text-slate-700">
        Këto kushte mund të përditësohen. Përdoruesit do të njoftohen për ndryshimet kryesore përmes
        njoftimeve te paneli.
      </p>

      <ContactBox />
    </>
  );
}

function ChildProtectionContent() {
  return (
    <>
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-rose-900">
        Mbrojtja e fëmijëve është detyrim ligjor i shkollës sipas <strong>UA Nr. 13/2018 për Mbrojtjen e
        Fëmijëve nga Dhuna në Sistemin e Arsimit</strong>. Asnjë formë dhune nuk tolerohet.
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">1. Parimet</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Çdo fëmijë ka të drejtën të jetë i sigurt në shkollë</li>
        <li>Interesi më i lartë i fëmijës mbi gjithçka tjetër</li>
        <li>Tolerancë zero ndaj çdo forme dhune fizike, verbale, psikologjike ose seksuale</li>
        <li>Konfidencialitet i plotë i informacioneve për incidentet</li>
        <li>Trajtim i barabartë pavarësisht përkatësisë etnike, gjinisë, fesë, aftësive</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">2. Llojet e dhunës që ndalohen</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Fizike:</strong> goditja, shtytja, dëmtimi trupor</li>
        <li><strong>Verbale:</strong> sharja, fyerja, përbuzja</li>
        <li><strong>Psikologjike:</strong> kërcënimet, izolimi, frikësimi</li>
        <li><strong>Bullizmi:</strong> ngacmimi i përsëritur nga bashkëmoshatarët</li>
        <li><strong>Diskriminim:</strong> trajtim i pabarabartë mbi baza identitare</li>
        <li><strong>Digjital:</strong> ngacmim online, ndarja e fotove pa pëlqim, mesazhe kërcënuese</li>
        <li><strong>Seksuale:</strong> çdo kontakt ose ekspozim i papërshtatshëm (raportim i menjëhershëm)</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">3. Procedura e raportimit</h3>
      <ol className="list-decimal pl-6 space-y-1 text-slate-700">
        <li><strong>Raportim i menjëhershëm</strong> te mësimdhënësi kujdestar, pedagogu ose drejtori</li>
        <li>Drejtori vlerëson rastin brenda 24 orësh</li>
        <li>Nëse është rast i rëndë, njoftohet menjëherë Drejtoria Komunale e Arsimit dhe Policia</li>
        <li>Pedagogu/psikologu ofron mbështetje psiko-sociale për viktimën</li>
        <li>Masa disiplinore për shkelësin sipas Kodit të Sjelljes</li>
        <li>Ndjekje e rastit dhe vlerësim periodik</li>
      </ol>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">4. Kontaktet emergjente</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Policia e Kosovës:</strong> 192</li>
        <li><strong>Numri i ndihmës për fëmijë:</strong> 116 111</li>
        <li><strong>Qendra për Punë Sociale</strong> (sipas komunës)</li>
        <li><strong>Drejtoria e Shkollës:</strong> shih cilësimet e shkollës për kontakt</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">5. Detyrat e stafit</h3>
      <p className="text-slate-700">
        Çdo punonjës i shkollës ka detyrim ligjor të raportojë çdo dyshim për dhunë ndaj fëmijëve.
        Mosraportimi mund të rezultojë në përgjegjësi disiplinore dhe ligjore.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">6. Mbrojtja e raportuesit</h3>
      <p className="text-slate-700">
        Identiteti i atij që raporton mbahet konfidencial. Asnjë sanksion ose dëmtim nuk lejohet ndaj
        personit që raporton në mirëbesim.
      </p>

      <ContactBox />
    </>
  );
}

function CodeOfConductContent() {
  return (
    <>
      <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">1. Vlerat e shkollës</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Respekti</strong> — për veten, të tjerët dhe pronën</li>
        <li><strong>Ndershmëria</strong> — në punë akademike dhe komunikim</li>
        <li><strong>Përgjegjësia</strong> — për veprimet dhe rolin shkollor</li>
        <li><strong>Bashkëpunimi</strong> — me bashkëmoshatarët dhe stafin</li>
        <li><strong>Përparimi</strong> — angazhim i përhershëm për të nxënë</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">2. Pritjet nga nxënësit</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Frekuentim i rregullt i orëve mësimore</li>
        <li>Përgatitja e detyrave të shtëpisë në kohë</li>
        <li>Respekt për mësimdhënësit, bashkënxënësit dhe stafin</li>
        <li>Ndalim i mashtrimit në provime dhe punime</li>
        <li>Ndalim i përdorimit të telefonit gjatë orës mësimore (përveç me leje)</li>
        <li>Veshje e përshtatshme dhe higjienë personale</li>
        <li>Ndalim i dhunës fizike ose verbale</li>
        <li>Ndalim i bullizmit në çdo formë</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">3. Pritjet nga prindërit</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Mbështetje e fëmijës në procesin mësimor</li>
        <li>Pjesëmarrje në takimet me prindër</li>
        <li>Komunikim respektues me stafin shkollor</li>
        <li>Arsyetim i mungesave brenda 3 ditëve</li>
        <li>Mirëkuptim për rregullat e shkollës</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">4. Pritjet nga mësimdhënësit</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li>Përgatitje e mirëfilltë e orës mësimore</li>
        <li>Vlerësim objektiv dhe i drejtë i nxënësve</li>
        <li>Respekt dhe trajtim i barabartë i të gjithë nxënësve</li>
        <li>Komunikim konstruktiv me prindërit</li>
        <li>Konfidencialitet i informacioneve për nxënësit</li>
        <li>Përditësim i vazhdueshëm profesional (ZHPM 100 orë/5 vjet)</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">5. Masat disiplinore për nxënësit</h3>
      <p className="text-slate-700">Sipas UA për Disiplinën Shkollore, masat radhiten nga më e leha tek më e rënda:</p>
      <ol className="list-decimal pl-6 space-y-1 text-slate-700">
        <li>Vërejtje me gojë</li>
        <li>Vërejtje me shkrim</li>
        <li>Largim i përkohshëm (1–5 ditë)</li>
        <li>Transferim në klasë tjetër</li>
        <li>Largim përfundimtar (vetëm për rastet e rënda dhe me miratim të Këshillit Drejtues)</li>
      </ol>
      <p className="mt-2 text-slate-700">
        Çdo masë duhet të jetë proporcionale me shkeljen dhe të dokumentohet në sistemin shkollor.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">6. E drejta e dëgjimit</h3>
      <p className="text-slate-700">
        Çdo nxënës ka të drejtën të dëgjohet para se të vendoset një masë disiplinore. Prindi
        njoftohet menjëherë për çdo masë.
      </p>

      <ContactBox />
    </>
  );
}

function CookiesContent() {
  return (
    <>
      <h3 className="text-lg font-bold text-slate-900 mt-2 mb-2">1. Çfarë janë kuki-t?</h3>
      <p className="text-slate-700">
        Kuki-t janë skedarë të vegjël teksti që ruhen në shfletuesin tuaj kur vizitoni një faqe web.
        Ato e ndihmojnë sistemin të mbajë mend disa informacione mes vizitave.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">2. Si i përdorim kuki-t</h3>
      <ul className="list-disc pl-6 space-y-1 text-slate-700">
        <li><strong>Të domosdoshme:</strong> për të ruajtur sesionin tuaj të kyçur (përmes Supabase Auth)</li>
        <li><strong>Funksionale:</strong> për të ruajtur preferencat (gjuha, tema, etj.)</li>
        <li><strong>Të mos përdorim:</strong> Nuk përdorim kuki marketingu ose tracking nga palë të treta</li>
      </ul>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">3. Lokal Storage</h3>
      <p className="text-slate-700">
        Përveç kuki-ve, përdorim localStorage të shfletuesit për të ruajtur preferenca lokale si
        gjuha e zgjedhur. Këto të dhëna nuk dërgohen te server-i dhe mund t'i fshini në çdo kohë
        nga cilësimet e shfletuesit.
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">4. Kuki nga palë të treta</h3>
      <p className="text-slate-700">
        Sistemi nuk përdor shërbime të palëve të treta që vendosin kuki (si Google Analytics, Facebook
        Pixel, etj.). Të dhënat tuaja qëndrojnë vetëm te ne dhe te Supabase (shërbimi i bazës së të dhënave).
      </p>

      <h3 className="text-lg font-bold text-slate-900 mt-6 mb-2">5. Si t'i çaktivizoni</h3>
      <p className="text-slate-700">
        Mund të çaktivizoni kuki-t nga cilësimet e shfletuesit tuaj. Vini re që kjo do të bëjë të
        pamundur kyçjen në sistem.
      </p>

      <ContactBox />
    </>
  );
}

function ContactBox() {
  const { t } = useI18n();
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
        <Mail className="w-5 h-5 text-slate-500 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-slate-900">{t('ld.contact_title')}</p>
          <p className="text-slate-600 mt-1">
            {t('ld.contact_school')}<br />
            <a href="https://aip.rks-gov.net" target="_blank" rel="noreferrer" className="text-blue-600 underline">
              {t('ld.contact_aip')}
            </a> {t('ld.contact_aip_suffix')}
          </p>
        </div>
      </div>
    </div>
  );
}
