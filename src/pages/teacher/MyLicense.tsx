import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  LICENSE_LEVEL_LABELS,
  ZHPM_CATEGORY_LABELS,
  type ProfessionalDevelopment,
  type ZHPMCategory,
} from '../../types/database';
import { Loader2, Award, Plus, X, CheckCircle, AlertTriangle, GraduationCap } from 'lucide-react';

export default function MyLicense() {
  const { profile } = useAuth();
  const [zhpm, setZhpm] = useState<ProfessionalDevelopment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    organizer: '',
    hours: '',
    completion_date: new Date().toISOString().slice(0, 10),
    category: 'didaktike_pedagogjike' as ZHPMCategory,
    certificate_url: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('professional_development')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('completion_date', { ascending: false });
    setZhpm(data || []);
    setLoading(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('professional_development').insert({
      teacher_id: profile.id,
      title: form.title,
      organizer: form.organizer,
      hours: Number(form.hours),
      completion_date: form.completion_date,
      category: form.category,
      certificate_url: form.certificate_url || null,
      notes: form.notes,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowAdd(false);
      setForm({
        title: '', organizer: '', hours: '',
        completion_date: new Date().toISOString().slice(0, 10),
        category: 'didaktike_pedagogjike', certificate_url: '', notes: '',
      });
      load();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const verifiedHours = zhpm.filter((z) => z.verified).reduce((sum, z) => sum + Number(z.hours), 0);
  const pendingHours = zhpm.filter((z) => !z.verified).reduce((sum, z) => sum + Number(z.hours), 0);
  const progress = Math.min((verifiedHours / 100) * 100, 100);

  const licenseExpires = profile?.license_expires_at;
  const daysUntilExpiry = licenseExpires
    ? Math.floor((new Date(licenseExpires).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Licenca Ime</h1>
            <p className="text-slate-500 text-sm">Statusi i licencës dhe trajnimeve (UA 05/2017)</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium"
        >
          <Plus className="w-4 h-4" />
          Shto Trajnim
        </button>
      </div>

      {/* License card */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase font-semibold text-indigo-700">Statusi i licencës</p>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {profile?.license_level ? LICENSE_LEVEL_LABELS[profile.license_level] : 'Pa licencë të specifikuar'}
            </h2>
            {profile?.license_number && (
              <p className="text-sm text-slate-600 mt-1 font-mono">Nr: {profile.license_number}</p>
            )}
            {profile?.subject_specialization && (
              <p className="text-sm text-slate-600">Lënda: {profile.subject_specialization}</p>
            )}
          </div>
          <div className="text-right">
            {daysUntilExpiry !== null ? (
              daysUntilExpiry < 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Skaduar para {-daysUntilExpiry} ditësh
                </div>
              ) : daysUntilExpiry < 365 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Skadon për {daysUntilExpiry} ditë
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Aktive deri {licenseExpires}
                </div>
              )
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-medium">
                Pa datë skadimi
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ZHPM progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">Zhvillimi Profesional (ZHPM)</h3>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          Sipas UA 05/2017, kërkohen <strong>100 orë</strong> ZHPM në cikël 5-vjeçar për ripërtëritje të licencës.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-700">Progresi i orëve të verifikuara</span>
            <span className="font-bold text-indigo-700">{verifiedHours.toFixed(0)} / 100 orë</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {pendingHours > 0 && (
            <p className="text-xs text-amber-600">+{pendingHours.toFixed(0)} orë në pritje të verifikimit nga drejtori</p>
          )}
        </div>
      </div>

      {/* Trainings list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Historiku i trajnimeve ({zhpm.length})</h3>
        </div>
        {zhpm.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë trajnim i regjistruar. Klik "Shto Trajnim" për të filluar.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {zhpm.map((z) => (
              <div key={z.id} className="px-5 py-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900">{z.title}</p>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                      {ZHPM_CATEGORY_LABELS[z.category]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {z.organizer && `${z.organizer} · `}
                    <strong>{z.hours} orë</strong> · {z.completion_date}
                  </p>
                  {z.notes && <p className="text-sm text-slate-600 mt-1 italic">{z.notes}</p>}
                </div>
                {z.verified ? (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3 h-3" />
                    Verifikuar
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                    Në pritje
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Shto Trajnim ZHPM</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Organizatori</label>
                <input type="text" value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} placeholder="P.sh. MAShTI, KEC, OJF" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orë *</label>
                  <input required type="number" min="0.5" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                  <input required type="date" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ZHPMCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  {(Object.keys(ZHPM_CATEGORY_LABELS) as ZHPMCategory[]).map((c) => (
                    <option key={c} value={c}>{ZHPM_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL e certifikatës</label>
                <input type="url" value={form.certificate_url} onChange={(e) => setForm({ ...form, certificate_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shënime</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl px-3 py-2">
                Trajnimi do të jetë në pritje deri sa drejtori ta verifikojë. Vetëm orët e verifikuara llogariten te 100 orët e kërkuara.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
