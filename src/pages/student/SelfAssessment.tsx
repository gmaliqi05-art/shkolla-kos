import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  SELF_ASSESS_LEVEL_COLORS,
  type SelfAssessmentLevel,
  type SelfAssessment,
} from '../../types/database';
import { Loader2, Heart, Plus, X, Edit2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import type { TranslationKey } from '../../lib/i18n/translations';

const LEVEL_KEYS: Record<SelfAssessmentLevel, TranslationKey> = {
  shkelqyeshem: 'self_level.shkelqyeshem',
  shume_mire: 'self_level.shume_mire',
  mire: 'self_level.mire',
  kenaqshem: 'self_level.kenaqshem',
  duhet_permiresuar: 'self_level.duhet_permiresuar',
};

const PERIOD_KEYS: Record<number, TranslationKey> = {
  1: 'period.1',
  2: 'period.2',
  3: 'period.3',
};

interface SubjectOption { id: string; name: string }

export default function SelfAssessmentPage() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [assessments, setAssessments] = useState<SelfAssessment[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SelfAssessment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    subject_id: '',
    period: 1,
    level: 'mire' as SelfAssessmentLevel,
    what_learned: '',
    what_to_improve: '',
    goals: '',
  });

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile) return;
    // Find student's class
    const { data: enr } = await supabase
      .from('student_classes')
      .select('class_id, classes(id, grade_level)')
      .eq('student_id', profile.id)
      .maybeSingle();
    type Row = { class_id: string; classes: { id: string; grade_level: number } | null };
    const enrRow = enr as unknown as Row | null;
    const cid = enrRow?.class_id || null;
    setClassId(cid);

    if (cid) {
      const { data: cs } = await supabase
        .from('class_subjects')
        .select('subject_id, subjects(id, name)')
        .eq('class_id', cid);
      type CSRow = { subjects: { id: string; name: string } | null };
      const subs: SubjectOption[] = [];
      const seen = new Set<string>();
      (cs || []).forEach((row) => {
        const r = row as unknown as CSRow;
        if (r.subjects && !seen.has(r.subjects.id)) {
          seen.add(r.subjects.id);
          subs.push(r.subjects);
        }
      });
      setSubjects(subs.sort((a, b) => a.name.localeCompare(b.name)));
    }

    const { data: sa } = await supabase
      .from('self_assessments')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false });
    setAssessments(sa || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      subject_id: subjects[0]?.id || '',
      period,
      level: 'mire',
      what_learned: '',
      what_to_improve: '',
      goals: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (a: SelfAssessment) => {
    setEditing(a);
    setForm({
      subject_id: a.subject_id || '',
      period: a.period || 1,
      level: a.level,
      what_learned: a.what_learned,
      what_to_improve: a.what_to_improve,
      goals: a.goals,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      student_id: profile.id,
      subject_id: form.subject_id || null,
      class_id: classId,
      period: form.period,
      level: form.level,
      what_learned: form.what_learned,
      what_to_improve: form.what_to_improve,
      goals: form.goals,
    };
    const res = editing
      ? await supabase.from('self_assessments').update(payload).eq('id', editing.id)
      : await supabase.from('self_assessments').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const filtered = assessments.filter((a) => a.period === period);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('student.self.title_my')}</h1>
            <p className="text-slate-500 text-sm">{t('student.self.subtitle_ua')}</p>
          </div>
        </div>
        <button onClick={openNew} disabled={!classId} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Plus className="w-4 h-4" />
          {t('student.self.add')}
        </button>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t(PERIOD_KEYS[p])}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          {t('student.self.none_for_period')} {t(PERIOD_KEYS[period])}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{a.subject_id ? subjectMap.get(a.subject_id) || t('nav.subjects') : t('student.self.general')}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${SELF_ASSESS_LEVEL_COLORS[a.level]}`}>
                    {t(LEVEL_KEYS[a.level])}
                  </span>
                </div>
                <button onClick={() => openEdit(a)} className="p-1 text-slate-400 hover:text-slate-700">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              {a.what_learned && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{t('student.self.what_learned')}</p>
                  <p className="text-sm text-slate-700">{a.what_learned}</p>
                </div>
              )}
              {a.what_to_improve && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{t('student.self.what_to_improve')}</p>
                  <p className="text-sm text-slate-700">{a.what_to_improve}</p>
                </div>
              )}
              {a.goals && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{t('student.self.my_goals')}</p>
                  <p className="text-sm text-slate-700">{a.goals}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? t('student.self.edit_title') : t('student.self.new_title')}</h2>
              <button onClick={() => setShowModal(false)} aria-label={t('common.close')}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('nav.subjects')}</label>
                  <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">{t('student.self.general_dash')}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.grades.period_label')}</label>
                  <select value={form.period} onChange={(e) => setForm({ ...form, period: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                    {[1, 2, 3].map((p) => <option key={p} value={p}>{t(PERIOD_KEYS[p])}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.self.how_doing')}</label>
                <select required value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as SelfAssessmentLevel })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                  {(Object.keys(LEVEL_KEYS) as SelfAssessmentLevel[]).map((l) => (
                    <option key={l} value={l}>{t(LEVEL_KEYS[l])}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.self.what_learned_q')}</label>
                <textarea rows={2} value={form.what_learned} onChange={(e) => setForm({ ...form, what_learned: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.self.what_to_improve_q')}</label>
                <textarea rows={2} value={form.what_to_improve} onChange={(e) => setForm({ ...form, what_to_improve: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('student.self.goals_next_q')}</label>
                <textarea rows={2} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">{t('common.cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
