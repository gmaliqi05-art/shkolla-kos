import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, Users2, X, ChevronDown, ChevronRight, Lock, Unlock, Trash2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import type { PeerAssessmentSession, PeerAssessment } from '../../types/database';

interface ClassSubjectOpt { id: string; class_id: string; subject_id: string; class_name: string; subject_name: string; }
type SessionRow = PeerAssessmentSession & { class_name: string; subject_name: string };
interface ResultRow { student_id: string; full_name: string; avg: number | null; count: number; }

export default function PeerAssessment() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectOpt[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ class_subject: '', title: '', description: '' });

  useEffect(() => {
    if (profile?.id || isDemo) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isDemo]);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setClassSubjects([{ id: 'cs1', class_id: 'c1', subject_id: 's1', class_name: 'Klasa 8-A', subject_name: 'Biologji' }]);
      setSessions([{ id: 'ps1', class_id: 'c1', subject_id: 's1', teacher_id: 'demo', title: 'Puna në grup: Ekosistemet', description: '', is_open: true, created_at: new Date().toISOString(), class_name: 'Klasa 8-A', subject_name: 'Biologji' }]);
      setLoading(false);
      return;
    }
    if (!profile) return;
    const { data: cs } = await supabase
      .from('class_subjects')
      .select('id, class_id, subject_id, classes(name), subjects(name)')
      .eq('teacher_id', profile.id);
    type CsRow = { id: string; class_id: string; subject_id: string; classes: { name: string } | null; subjects: { name: string } | null };
    const opts = ((cs as unknown as CsRow[]) || []).map((r) => ({
      id: r.id, class_id: r.class_id, subject_id: r.subject_id,
      class_name: r.classes?.name || '', subject_name: r.subjects?.name || '',
    }));
    setClassSubjects(opts);
    const csByKey = new Map(opts.map((o) => [`${o.class_id}|${o.subject_id}`, o]));

    const { data: sess } = await supabase
      .from('peer_assessment_sessions')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('created_at', { ascending: false });
    setSessions(((sess as PeerAssessmentSession[]) || []).map((s) => {
      const cs2 = csByKey.get(`${s.class_id}|${s.subject_id}`);
      return { ...s, class_name: cs2?.class_name || '', subject_name: cs2?.subject_name || '' };
    }));
    setLoading(false);
  };

  const openResults = async (s: SessionRow) => {
    if (expanded === s.id) { setExpanded(null); return; }
    setExpanded(s.id);
    setResultsLoading(true);
    const { data: enrolls } = await supabase.from('student_classes').select('student_id').eq('class_id', s.class_id);
    const ids = (enrolls || []).map((e: { student_id: string }) => e.student_id);
    const nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids).is('deleted_at', null);
      (profs || []).forEach((p) => nameMap.set(p.id, p.full_name));
    }
    const { data: pas } = await supabase.from('peer_assessments').select('assessed_id, score').eq('session_id', s.id);
    const agg = new Map<string, { sum: number; n: number }>();
    ((pas as Pick<PeerAssessment, 'assessed_id' | 'score'>[]) || []).forEach((a) => {
      const cur = agg.get(a.assessed_id) || { sum: 0, n: 0 };
      cur.sum += a.score; cur.n += 1; agg.set(a.assessed_id, cur);
    });
    const rows: ResultRow[] = Array.from(nameMap.entries()).map(([id, full_name]) => {
      const a = agg.get(id);
      return { student_id: id, full_name, avg: a ? a.sum / a.n : null, count: a?.n || 0 };
    }).sort((x, y) => (y.avg ?? -1) - (x.avg ?? -1));
    setResults(rows);
    setResultsLoading(false);
  };

  const openNew = () => {
    setForm({ class_subject: classSubjects[0]?.id || '', title: '', description: '' });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cs = classSubjects.find((c) => c.id === form.class_subject);
    if (!cs) { setError(t('pa.pick_class')); return; }
    if (!form.title.trim()) { setError(t('pa.title_required')); return; }
    setSaving(true);
    setError('');
    if (isDemo) {
      setSessions((prev) => [{ id: `demo-${Date.now()}`, class_id: cs.class_id, subject_id: cs.subject_id, teacher_id: 'demo', title: form.title, description: form.description, is_open: true, created_at: new Date().toISOString(), class_name: cs.class_name, subject_name: cs.subject_name }, ...prev]);
      setShowModal(false); setSaving(false); return;
    }
    if (!profile) return;
    const { error: err } = await supabase.from('peer_assessment_sessions').insert({
      class_id: cs.class_id, subject_id: cs.subject_id, teacher_id: profile.id,
      title: form.title, description: form.description,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast.success(t('pa.session_created'));
    setShowModal(false);
    load();
  };

  const toggleOpen = async (s: SessionRow) => {
    if (isDemo) { setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, is_open: !x.is_open } : x)); return; }
    const { error: err } = await supabase.from('peer_assessment_sessions').update({ is_open: !s.is_open }).eq('id', s.id);
    if (err) { toast.error(err.message); return; }
    setSessions((prev) => prev.map((x) => x.id === s.id ? { ...x, is_open: !x.is_open } : x));
  };

  const remove = async (s: SessionRow) => {
    if (!confirm(t('pa.delete_confirm'))) return;
    if (isDemo) { setSessions((prev) => prev.filter((x) => x.id !== s.id)); return; }
    const { error: err } = await supabase.from('peer_assessment_sessions').delete().eq('id', s.id);
    if (err) { toast.error(err.message); return; }
    toast.success(t('pa.deleted'));
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
            <Users2 className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('pa.title')}</h1>
            <p className="text-slate-500 text-sm">{t('pa.subtitle')}</p>
          </div>
        </div>
        <button onClick={openNew} disabled={classSubjects.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Plus className="w-4 h-4" /> {t('pa.new_session')}
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">{t('pa.no_sessions')}</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">{s.subject_name}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{s.class_name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.is_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.is_open ? t('pa.open') : t('pa.closed')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-1">{s.title}</h3>
                  {s.description && <p className="text-sm text-slate-600 mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleOpen(s)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded" title={s.is_open ? t('pa.close') : t('pa.reopen')}>
                    {s.is_open ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(s)} className="p-1.5 text-slate-300 hover:text-rose-600 rounded" title={t('pa.delete')}><Trash2 className="w-4 h-4" /></button>
                  <button onClick={() => openResults(s)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                    {expanded === s.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {expanded === s.id && (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">{t('pa.results')}</h4>
                  {resultsLoading ? (
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                  ) : results.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('pa.no_students')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {results.map((r) => (
                        <li key={r.student_id} className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-1.5 text-sm">
                          <span className="text-slate-800">{r.full_name}</span>
                          <span className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{r.avg !== null ? r.avg.toFixed(2) : '—'}</span>
                            <span className="text-xs text-slate-400">({r.count} {t('pa.ratings')})</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t('pa.new_session')}</h2>
              <button onClick={() => setShowModal(false)} aria-label={t('common.close')}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pa.class_subject')}</label>
                <select required value={form.class_subject} onChange={(e) => setForm({ ...form, class_subject: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                  {classSubjects.map((c) => <option key={c.id} value={c.id}>{c.class_name} · {c.subject_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pa.session_title')}</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pa.session_desc')}</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
