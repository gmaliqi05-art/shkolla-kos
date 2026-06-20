import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, Lock, X, Trash2, NotebookPen } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import {
  COUNSELING_CATEGORY_LABELS,
  type CounselingCategory,
  type CounselingNote,
} from '../../types/database';

interface StudentOpt { id: string; full_name: string }

const CATEGORIES = Object.keys(COUNSELING_CATEGORY_LABELS) as CounselingCategory[];

const CATEGORY_COLORS: Record<CounselingCategory, string> = {
  keshillim: 'bg-blue-100 text-blue-700',
  sjellje: 'bg-amber-100 text-amber-700',
  akademik: 'bg-violet-100 text-violet-700',
  emocional: 'bg-rose-100 text-rose-700',
  familjar: 'bg-emerald-100 text-emerald-700',
  tjeter: 'bg-slate-100 text-slate-600',
};

const DEMO_NOTES: (CounselingNote & { student_name: string })[] = [
  { id: 'd1', student_id: 's1', pedagog_id: 'p1', category: 'emocional', title: 'Ankth para provimeve', note: 'Nxënësi shfaq ankth; rekomanduar teknika frymëmarrjeje dhe takim me prindin.', is_confidential: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString(), updated_at: new Date(Date.now() - 3 * 86400000).toISOString(), student_name: 'Ardi Krasniqi' },
];

export default function CounselingNotes() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<(CounselingNote & { student_name: string })[]>([]);
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ student_id: '', category: 'keshillim' as CounselingCategory, title: '', note: '' });

  useEffect(() => {
    if (profile?.id || isDemo) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isDemo]);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setNotes(DEMO_NOTES);
      setStudents([{ id: 's1', full_name: 'Ardi Krasniqi' }, { id: 's2', full_name: 'Nora Cela' }]);
      setLoading(false);
      return;
    }
    if (!profile) return;

    const { data: studs } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'nxenes')
      .is('deleted_at', null)
      .order('full_name');
    const studentList = studs || [];
    setStudents(studentList);
    const nameMap = new Map(studentList.map((s) => [s.id, s.full_name]));

    const { data: rows, error: err } = await supabase
      .from('counseling_notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      toast.error(err.message);
      setLoading(false);
      return;
    }
    setNotes((rows || []).map((r: CounselingNote) => ({ ...r, student_name: nameMap.get(r.student_id) || '—' })));
    setLoading(false);
  };

  const openNew = () => {
    setForm({ student_id: students[0]?.id || '', category: 'keshillim', title: '', note: '' });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id) { setError(t('cn.pick_student')); return; }
    if (!form.title.trim()) { setError(t('cn.title_required')); return; }
    setSaving(true);
    setError('');
    if (isDemo) {
      const student = students.find((s) => s.id === form.student_id);
      setNotes((prev) => [{
        id: `demo-${Date.now()}`, student_id: form.student_id, pedagog_id: 'demo', category: form.category,
        title: form.title, note: form.note, is_confidential: true,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        student_name: student?.full_name || '—',
      }, ...prev]);
      setShowModal(false);
      setSaving(false);
      return;
    }
    if (!profile) return;
    const { error: err } = await supabase.from('counseling_notes').insert({
      student_id: form.student_id,
      pedagog_id: profile.id,
      category: form.category,
      title: form.title,
      note: form.note,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast.success(t('cn.saved'));
    setShowModal(false);
    load();
  };

  const remove = async (note: CounselingNote) => {
    if (!confirm(t('cn.delete_confirm'))) return;
    if (isDemo) { setNotes((prev) => prev.filter((n) => n.id !== note.id)); return; }
    const { error: err } = await supabase.from('counseling_notes').delete().eq('id', note.id);
    if (err) { toast.error(err.message); return; }
    toast.success(t('cn.deleted'));
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
            <NotebookPen className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('cn.title')}</h1>
            <p className="text-slate-500 text-sm">{t('cn.subtitle')}</p>
          </div>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium">
          <Plus className="w-4 h-4" />
          {t('cn.new')}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <Lock className="w-4 h-4 shrink-0" />
        {t('cn.confidential_notice')}
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
          {t('cn.none')}
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{n.student_name}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[n.category]}`}>
                      {COUNSELING_CATEGORY_LABELS[n.category]}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-800 mt-1">{n.title}</h3>
                  {n.note && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{n.note}</p>}
                  <p className="text-xs text-slate-400 mt-2">{new Date(n.created_at).toLocaleDateString('sq-AL')}</p>
                </div>
                <button onClick={() => remove(n)} aria-label={t('cn.delete')} className="p-1.5 text-slate-300 hover:text-rose-600 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t('cn.new')}</h2>
              <button onClick={() => setShowModal(false)} aria-label={t('common.close')}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('cn.student')}</label>
                <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">{t('cn.pick_student')}</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('cn.category')}</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CounselingCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{COUNSELING_CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('cn.note_title')}</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('cn.note_body')}</label>
                <textarea rows={4} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
