import { Shield, FileCheck, UserX, Lock, Eye, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Politika e Privatësisë</h1>
              <p className="text-slate-500 text-sm">Përpunimi i të dhënave personale në Shkolla Kos</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-6">
            <p className="text-sm text-blue-900">
              Kjo politikë është hartuar në përputhje me <strong>Ligjin Nr. 06/L-082 për Mbrojtjen e të Dhënave Personale</strong> të Republikës së Kosovës dhe parimet e GDPR.
              Sistemi përpunon të dhënat e fëmijëve të mitur dhe kjo kërkon kujdes të veçantë ligjor.
            </p>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              1. Çfarë të dhënash mbledhim
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li><strong>Të dhëna identifikuese:</strong> emër, mbiemër, numri personal (10 shifra), datëlindja, vendlindja, gjinia, adresa, gjuha amtare, kombësia (vetëdeklarim).</li>
              <li><strong>Kontakte:</strong> email, telefon, kontakt emergjent.</li>
              <li><strong>Të dhëna kujdestarie:</strong> emri i kujdestarit ligjor dhe lidhja.</li>
              <li><strong>Të dhëna akademike:</strong> notat, frekuentimi, sjellja, masat disiplinore, orari.</li>
              <li><strong>Të dhëna mjekësore bazike:</strong> vetëm me pëlqimin tuaj, për sigurinë e fëmijës.</li>
              <li><strong>Gjurmë teknike:</strong> hyrjet në sistem (kohë, IP, user-agent) për auditim sigurie.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              2. Pse i përpunojmë
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>Përmbushja e detyrimit ligjor sipas Ligjit 04/L-032 për Arsimin Parauniversitar.</li>
              <li>Mbajtja e Amzës dhe dokumentacionit pedagogjik (UA 19/2018).</li>
              <li>Komunikimi me prindërit/kujdestarët ligjorë.</li>
              <li>Lëshimi i dëftesave, certifikatave dhe diplomave.</li>
              <li>Mbrojtja e fëmijës (kontakti emergjent, kushte mjekësore).</li>
              <li>Statistikat anonime për përmirësimin e arsimit.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              3. Kush ka qasje
            </h2>
            <p className="text-sm text-slate-700 mb-3">
              Qasja zbatohet me politika strikte (RLS) në bazën e të dhënave:
            </p>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Roli</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">Qasja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-3 py-2 font-medium">Drejtori</td><td className="px-3 py-2 text-slate-600">Të gjitha të dhënat akademike + audit log</td></tr>
                <tr><td className="px-3 py-2 font-medium">Mësuesi</td><td className="px-3 py-2 text-slate-600">Vetëm klasat dhe lëndët që mëson</td></tr>
                <tr><td className="px-3 py-2 font-medium">Prindi</td><td className="px-3 py-2 text-slate-600">Vetëm të dhënat e fëmijës së tij</td></tr>
                <tr><td className="px-3 py-2 font-medium">Nxënësi</td><td className="px-3 py-2 text-slate-600">Vetëm të dhënat e veta</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-500 mt-2">Çdo qasje në të dhënat e ndjeshme regjistrohet në audit log dhe është e disponueshme për drejtorin.</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              4. Të drejtat tuaja
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li><strong>E drejta e qasjes:</strong> të shihni të gjitha të dhënat që kemi për fëmijën tuaj.</li>
              <li><strong>E drejta e korrigjimit:</strong> të kërkoni saktësimin e të dhënave të pasakta.</li>
              <li><strong>E drejta e harresës:</strong> të kërkoni fshirjen e të dhënave kur baza ligjore nuk ekziston më.</li>
              <li><strong>E drejta e kufizimit:</strong> të kufizoni përpunimin e të dhënave në raste të caktuara.</li>
              <li><strong>E drejta e kundërshtimit:</strong> të kundërshtoni përpunimin e të dhënave për qëllime që nuk janë ligjore.</li>
              <li><strong>E drejta e portabilitetit:</strong> të merrni një kopje të të dhënave në format të lexueshëm.</li>
            </ul>
            <p className="text-sm text-slate-700 mt-3">
              Për të ushtruar këto të drejta, prindi mund të paraqesë kërkesë te drejtoria e shkollës ose përmes panelit "Privatësia" në sistem.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Periudha e ruajtjes</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li><strong>Amza (Regjistri Amzë):</strong> ruajtje e përhershme (detyrim ligjor).</li>
              <li><strong>Dëftesat dhe diplomat:</strong> 75 vjet.</li>
              <li><strong>Notat dhe frekuentimi:</strong> 25 vjet.</li>
              <li><strong>Mesazhet dhe njoftimet:</strong> 5 vjet.</li>
              <li><strong>Audit logs:</strong> 2 vjet, pastaj arkivohen.</li>
              <li><strong>Pëlqimet:</strong> aq sa zgjat marrëdhënia + 5 vjet pas largimit.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Siguria</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>Lidhje e enkriptuar (HTTPS) për çdo komunikim.</li>
              <li>Të dhënat e ruajtura me enkriptim në Supabase (PostgreSQL).</li>
              <li>Politika Row-Level Security (RLS) që aplikohen në bazën e të dhënave.</li>
              <li>Audit log për çdo qasje dhe modifikim të të dhënave të ndjeshme.</li>
              <li>Detyrim për ndryshim të fjalëkalimit në hyrjen e parë.</li>
              <li>Sesione me skadim automatik.</li>
            </ul>
          </section>

          <section className="mt-8 bg-slate-50 rounded-xl p-5">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              7. Kontakt
            </h2>
            <p className="text-sm text-slate-700">
              Për çdo pyetje ose ankesë në lidhje me të dhënat personale, kontaktoni:
            </p>
            <ul className="list-none mt-2 space-y-1 text-sm">
              <li><strong>Drejtoria e Shkollës</strong> — direkt te drejtori i shkollës.</li>
              <li><strong>Agjencia për Informim dhe Privatësi (AIP):</strong> <a href="https://aip.rks-gov.net" target="_blank" rel="noreferrer" className="text-blue-600 underline">aip.rks-gov.net</a></li>
            </ul>
          </section>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Përditësuar së fundi: 19 Maj 2026 · Bazuar te Ligji Nr. 06/L-082</p>
            <Link to="/" className="text-sm text-blue-600 hover:underline">Kthehu te kryesorja →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
