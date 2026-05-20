import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import {
  LICENSE_LEVEL_LABELS,
  ZHPM_CATEGORY_LABELS,
  type LicenseLevel,
  type ProfessionalDevelopment,
  type Profile,
} from '../../types/database';
import { Loader2, Award, AlertTriangle, CheckCircle, Edit2, X, FileCheck, GraduationCap } from 'lucide-react';

interface TeacherRow extends Profile {
  zhpm_hours: number;
}

export default function TeacherLicensing() {
  const { profile } = useAuth();
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TeacherRow | null>(null);
  const [zhpmList, setZhpmList] = useState<ProfessionalDevelopment[]>([]);
  const [showZhpm, setShowZhpm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    license_number: '',
    license_level: '' as LicenseLevel | '',
    license_issued_at: '',
    license_expires_at: '',
    qualification: '',
    subject_specialization: '',
    hired_at: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'mesues')
      .is('deleted_at', null)
      .order('full_name');

    const teacherList: Profile[] = profiles || [];
    if (teacherList.length === 0) {
      setTeachers([]);
      setLoading(false);
      return;
    }

    const ids = teacherList.map((t) => t.id);
    const { data: zhpm } = await supabase
      .from('professional_development')
      .select('teacher_id, hours, verified')
      .in('teacher_id', ids)
      .eq('verified', true);

    const hoursByTeacher = new Map<string, number>();
    (zhpm || []).forEach((z: { teacher_id: string; hours: number }) => {
      const current = hoursByTeacher.get(z.teacher_id) || 0;
      hoursByTeacher.set(z.teacher_id, current + Number(z.hours));
    });

    setTeachers(teacherList.map((t) => ({
      ...t,
      zhpm_hours: hoursByTeacher.get(t.id) || 0,
    })));
    setLoading(false);
  };

  const loadZhpm = async (teacherId: string) => {
    const { data } = await supabase
      .from('professional_development')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('completion_date', { ascending: false });
    setZhpmList(data || []);
  };

  const openEdit = (t: TeacherRow) => {
    setEditing(t);
    setError('');
    setForm({
      license_number: t.license_number || '',
      license_level: t.license_level || '',
      license_issued_at: t.license_issued_at || '',
      license_expires_at: t.license_expires_at || '',
      qualification: t.qualification || '',
      subject_specialization: t.subject_specialization || '',
      hired_at: t.hired_at || '',
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !profile) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase
      .from('profiles')
      .update({
        license_number: form.license_number || null,
        license_level: form.license_level || null,
        license_issued_at: form.license_issued_at || null,
        license_expires_at: form.license_expires_at || null,
        qualification: form.qualification,
        subject_specialization: form.subject_specialization,
        hired_at: form.hired_at || null,
      })
      .eq('id', editing.id);
    if (err) {
      setError(err.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'update',
        resourceType: 'teacher_license',
        targetUserId: editing.id,
      });
      setEditing(null);
      load();
    }
    setSubmitting(false);
  };

  const verifyZhpm = async (zhpmId: string) => {
    if (!profile) return;
    await supabase
      .from('professional_development')
      .update({
        verified: true,
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', zhpmId);
    if (showZhpm) loadZhpm(showZhpm);
    load();
  };

  const getLicenseStatus = (t: TeacherRow): { label: string; color: string; icon: typeof CheckCircle } => {
    if (!t.license_expires_at) return { label: 'Pa licencë', color: 'bg-rose-100 text-rose-700', icon: AlertTriangle };
    const days = Math.floor((new Date(t.license_expires_at).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: `Skaduar para ${-days} ditësh`, color: 'bg-rose-100 text-rose-700', icon: AlertTriangle };
    if (days < 365) return { label: `Skadon për ${days} ditë`, color: 'bg-amber-100 text-amber-700', icon: AlertTriangle };
    return { label: `Aktive (skadon ${t.license_expires_at})`, color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Award className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Licencimi i Mësimdhënësve</h1>
          <p className="text-slate-500 text-sm">UA 05/2017 — licencat dhe orët e ZHPM (100 orë / 5 vjet)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {teachers.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Asnjë mësimdhënës i regjistruar.</div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Mësimdhënësi</th>
                <th className="px-4 py-3">Niveli</th>
                <th className="px-4 py-3">Nr. Licencës</th>
                <th className="px-4 py-3">Statusi</th>
                <th className="px-4 py-3">ZHPM (orë)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {teachers.map((t) => {
                const st = getLicenseStatus(t);
                const Icon = st.icon;
                const hoursColor = t.zhpm_hours >= 100 ? 'text-emerald-700 font-semibold' : t.zhpm_hours >= 50 ? 'text-amber-700' : 'text-rose-700';
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{t.full_name}</p>
                      {t.subject_specialization && <p className="text-xs text-slate-500">{t.subject_specialization}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.license_level ? LICENSE_LEVEL_LABELS[t.license_level] : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.license_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>
                        <Icon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className={`px-4 py-3 ${hoursColor}`}>
                      {t.zhpm_hours.toFixed(0)} / 100
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => { setShowZhpm(t.id); loadZhpm(t.id); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        ZHPM
                      </button>
                      <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Licenca e {editing.full_name}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nr. i licencës</label>
                  <input type="text" value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveli</label>
                  <select value={form.license_level} onChange={(e) => setForm({ ...form, license_level: e.target.value as LicenseLevel | '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">— Pa specifikim —</option>
                    {(Object.keys(LICENSE_LEVEL_LABELS) as LicenseLevel[]).map((l) => (
                      <option key={l} value={l}>{LICENSE_LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e lëshimit</label>
                  <input type="date" value={form.license_issued_at} onChange={(e) => setForm({ ...form, license_issued_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e skadimit (5 vjet)</label>
                  <input type="date" value={form.license_expires_at} onChange={(e) => setForm({ ...form, license_expires_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kualifikimi</label>
                  <input type="text" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="P.sh. Bachelor, Master" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specializimi lëndor</label>
                  <input type="text" value={form.subject_specialization} onChange={(e) => setForm({ ...form, subject_specialization: e.target.value })} placeholder="P.sh. Matematikë, Gjuhë shqipe" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e punësimit</label>
                  <input type="date" value={form.hired_at} onChange={(e) => setForm({ ...form, hired_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZHPM MODAL */}
      {showZhpm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Trajnimet (ZHPM)</h2>
              <button onClick={() => setShowZhpm(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {zhpmList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Asnjë trajnim i regjistruar.</p>
            ) : (
              <div className="space-y-2">
                {zhpmList.map((z) => (
                  <div key={z.id} className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{z.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {z.organizer && `${z.organizer} · `}
                          {z.hours} orë · {z.completion_date}
                        </p>
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                          {ZHPM_CATEGORY_LABELS[z.category]}
                        </span>
                      </div>
                      {z.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3" />
                          Verifikuar
                        </span>
                      ) : (
                        <button
                          onClick={() => verifyZhpm(z.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileCheck className="w-3 h-3" />
                          Verifiko
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
