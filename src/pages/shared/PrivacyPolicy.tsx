import { Shield, FileCheck, UserX, Lock, Eye, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../lib/i18n/I18nProvider';

export default function PrivacyPolicy() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{t('pp.title')}</h1>
              <p className="text-slate-500 text-sm">{t('pp.subtitle')}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 my-6">
            <p className="text-sm text-blue-900">{t('pp.legal_banner')}</p>
          </div>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              {t('pp.s1_title')}
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>{t('pp.s1_b1')}</li>
              <li>{t('pp.s1_b2')}</li>
              <li>{t('pp.s1_b3')}</li>
              <li>{t('pp.s1_b4')}</li>
              <li>{t('pp.s1_b5')}</li>
              <li>{t('pp.s1_b6')}</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              {t('pp.s2_title')}
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>{t('pp.s2_b1')}</li>
              <li>{t('pp.s2_b2')}</li>
              <li>{t('pp.s2_b3')}</li>
              <li>{t('pp.s2_b4')}</li>
              <li>{t('pp.s2_b5')}</li>
              <li>{t('pp.s2_b6')}</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              {t('pp.s3_title')}
            </h2>
            <p className="text-sm text-slate-700 mb-3">{t('pp.s3_intro')}</p>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">{t('login.role')}</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">{t('pp.s3_col_access')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-3 py-2 font-medium">{t('role.drejtor')}</td><td className="px-3 py-2 text-slate-600">{t('pp.s3_director_access')}</td></tr>
                <tr><td className="px-3 py-2 font-medium">{t('role.mesues')}</td><td className="px-3 py-2 text-slate-600">{t('pp.s3_teacher_access')}</td></tr>
                <tr><td className="px-3 py-2 font-medium">{t('role.prind')}</td><td className="px-3 py-2 text-slate-600">{t('pp.s3_parent_access')}</td></tr>
                <tr><td className="px-3 py-2 font-medium">{t('role.nxenes')}</td><td className="px-3 py-2 text-slate-600">{t('pp.s3_student_access')}</td></tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-500 mt-2">{t('pp.s3_audit_note')}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserX className="w-5 h-5 text-rose-600" />
              {t('pp.s4_title')}
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>{t('pp.s4_b1')}</li>
              <li>{t('pp.s4_b2')}</li>
              <li>{t('pp.s4_b3')}</li>
              <li>{t('pp.s4_b4')}</li>
              <li>{t('pp.s4_b5')}</li>
              <li>{t('pp.s4_b6')}</li>
            </ul>
            <p className="text-sm text-slate-700 mt-3">{t('pp.s4_exercise')}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('pp.s5_title')}</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>{t('pp.s5_b1')}</li>
              <li>{t('pp.s5_b2')}</li>
              <li>{t('pp.s5_b3')}</li>
              <li>{t('pp.s5_b4')}</li>
              <li>{t('pp.s5_b5')}</li>
              <li>{t('pp.s5_b6')}</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">{t('pp.s6_title')}</h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-slate-700">
              <li>{t('pp.s6_b1')}</li>
              <li>{t('pp.s6_b2')}</li>
              <li>{t('pp.s6_b3')}</li>
              <li>{t('pp.s6_b4')}</li>
              <li>{t('pp.s6_b5')}</li>
              <li>{t('pp.s6_b6')}</li>
            </ul>
          </section>

          <section className="mt-8 bg-slate-50 rounded-xl p-5">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              {t('pp.s7_title')}
            </h2>
            <p className="text-sm text-slate-700">{t('pp.s7_intro')}</p>
            <ul className="list-none mt-2 space-y-1 text-sm">
              <li><strong>{t('pp.s7_school')}</strong></li>
              <li><strong>{t('pp.s7_aip')}</strong> <a href="https://aip.rks-gov.net" target="_blank" rel="noreferrer" className="text-blue-600 underline">aip.rks-gov.net</a></li>
            </ul>
          </section>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{t('pp.updated')}</p>
            <Link to="/" className="text-sm text-blue-600 hover:underline">{t('pp.back_home')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
