import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, GraduationCap, X, Trash2 } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import {
  RETAKE_EXAM_TYPE_LABELS,
  RETAKE_RESULT_LABELS,
  type RetakeExam,
  type RetakeExamType,
} from '../../types/database';

interface ClassSubjectOpt { id: string; class_id: string; subject_id: string; class_name: string; subject_name: string; }
interface StudentOpt { id: string; full_name: string; }
type RetakeRow = RetakeExam & { student_name: string };

const PASS_THRESHOLD = 2; // Shkalla 1–5: 1 = ngeli, >=2 = kaloi

export default function RetakeExams() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectOpt[]>([]);
  const [selectedCs, setSelectedCs] = useState<string>('');
  const [students, setStudents] = useState<StudentOpt[]>([]);
  const [rows, setRows] = useState<RetakeRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    exam_type: 'riprovim' as RetakeExamType,
    exam_date: new Date().toISOString().slice(0, 10),
    annual_grade: '',
    exam_grade: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.id || isDemo) loadCs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isDemo]);

  useEffect(() => {
    if (selectedCs) loadForCs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCs]);

  const loadCs = async () => {
    setLoading(true);
    if (isDemo) {
      const demo: ClassSubjectOpt[] = [
        { id: 'cs1', class_id: 'c1', subject_id: 's1', class_name: 'Klasa 9-A', subject_name: 'Matematikë' },
      ];
      setClassSubjects(demo);
      setSelectedCs('cs1');
      setLoading(false);
      return;
    }
    if (!profile) return;
    const { data } = await supabase
      .from('class_subjects')
      .select('id, class_id, subject_id, classes(name), subjects(name)')
      .eq('teacher_id', profile.id);
    type Row = { id: string; class_id: string; subject_id: string; classes: { name: string } | null; subjects: { name: string } | null };
    const opts = ((data as unknown as Row[]) || []).map((r) => ({
      id: r.id,
      class_id: r.class_id,
      subject_id: r.subject_id,
      class_name: r.classes?.name || '',
      subject_name: r.subjects?.name || '',
    })).sort((a, b) => a.class_name.localeCompare(b.class_name));
    setClassSubjects(opts);
    if (opts.length > 0 && !selectedCs) setSelectedCs(opts[0].id);
    setLoading(false);
  };

  const loadForCs = async () => {
    const cs = classSubjects.find((c) => c.id === selectedCs);
    if (!cs) return;
    if (isDemo) {
      setStudents([{ id: 'st1', full_name: 'Ardi Krasniqi' }, { id: 'st2', full_name: 'Nora Cela' }]);
      setRows([{
        id: 'r1', student_id: 'st1', subject_id: cs.subject_id, class_id: cs.class_id, academic_year_id: null,
        exam_type: 'riprovim', annual_grade: 1, exam_date: new Date().toISOString().slice(0, 10), exam_grade: 3,
        result: 'kaloi', examiner_id: 'demo', notes: '', created_at: new Date().toISOString(), student_name: 'Ardi Krasniqi',
      }]);
      return;
    }
    const { data: enrolls } = await supabase.from('student_classes').select('student_id').eq('class_id', cs.class_id);
    const ids = (enrolls || []).map((e: { student_id: string }) => e.student_id);
    const nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', ids).is('deleted_at', null).order('full_name');
      (profs || []).forEach((p) => nameMap.set(p.id, p.full_name));
      setStudents((profs || []).map((p) => ({ id: p.id, full_name: p.full_name })));
    } else {
      setStudents([]);
    }
    const { data: exams } = await supabase
      .from('retake_exams')
      .select('*')
      .eq('class_id', cs.class_id)
      .eq('subject_id', cs.subject_id)
      .order('exam_date', { ascending: false });
    setRows(((exams as RetakeExam[]) || []).map((e) => ({ ...e, student_name: nameMap.get(e.student_id) || '—' })));
  };

  const openNew = () => {
    setForm({ student_id: students[0]?.id || '', exam_type: 'riprovim', exam_date: new Date().toISOString().slice(0, 10), annual_grade: '', exam_grade: '', notes: '' });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cs = classSubjects.find((c) => c.id === selectedCs);
    if (!cs) return;
    if (!form.student_id) { setError(t('re.pick_student')); return; }
    const grade = Number(form.exam_grade);
    if (!form.exam_grade || isNaN(grade) || grade < 1 || grade > 5) { setError(t('re.grade_invalid')); return; }
    const result = grade >= PASS_THRESHOLD ? 'kaloi' : 'ngeli';
    setSaving(true);
    setError('');

    if (isDemo) {
      const student = students.find((s) => s.id === form.student_id);
      setRows((prev) => [{
        id: `demo-${Date.now()}`, student_id: form.student_id, subject_id: cs.subject_id, class_id: cs.class_id,
        academic_year_id: null, exam_type: form.exam_type, annual_grade: form.annual_grade ? Number(form.annual_grade) : null,
        exam_date: form.exam_date, exam_grade: grade, result, examiner_id: 'demo', notes: form.notes,
        created_at: new Date().toISOString(), student_name: student?.full_name || '—',
      }, ...prev]);
      setShowModal(false);
      setSaving(false);
      return;
    }
    if (!profile) return;
    const { data: cls } = await supabase.from('classes').select('academic_year_id').eq('id', cs.class_id).maybeSingle();
    const { error: err } = await supabase.from('retake_exams').insert({
      student_id: form.student_id,
      subject_id: cs.subject_id,
      class_id: cs.class_id,
      academic_year_id: cls?.academic_year_id || null,
      exam_type: form.exam_type,
      annual_grade: form.annual_grade ? Number(form.annual_grade) : null,
      exam_date: form.exam_date,
      exam_grade: grade,
      result,
      examiner_id: profile.id,
      notes: form.notes,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast.success(t('re.saved'));
    setShowModal(false);
    loadForCs();
  };

  const remove = async (row: RetakeRow) => {
    if (!confirm(t('re.delete_confirm'))) return;
    if (isDemo) { setRows((prev) => prev.filter((r) => r.id !== row.id)); return; }
    const { error: err } = await supabase.from('retake_exams').delete().eq('id', row.id);
    if (err) { toast.error(err.message); return; }
    toast.success(t('re.deleted'));
    loadForCs();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('re.title')}</h1>
            <p className="text-slate-500 text-sm">{t('re.subtitle')}</p>
          </div>
        </div>
        <button onClick={openNew} disabled={classSubjects.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Plus className="w-4 h-4" /> {t('re.new')}
        </button>
      </div>

      {classSubjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">{t('re.no_classes')}</div>
      ) : (
        <>
          <div className="max-w-sm">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.class_subject')}</label>
            <select value={selectedCs} onChange={(e) => setSelectedCs(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
              {classSubjects.map((cs) => <option key={cs.id} value={cs.id}>{cs.class_name} · {cs.subject_name}</option>)}
            </select>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">{t('re.none')}</div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">{t('re.student')}</th>
                    <th className="text-left px-4 py-2 font-medium">{t('re.type')}</th>
                    <th className="text-center px-3 py-2 font-medium">{t('re.annual')}</th>
                    <th className="text-center px-3 py-2 font-medium">{t('re.exam_grade')}</th>
                    <th className="text-center px-3 py-2 font-medium">{t('re.result')}</th>
                    <th className="text-left px-3 py-2 font-medium">{t('re.date')}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-medium text-slate-900">{r.student_name}</td>
                      <td className="px-4 py-2 text-slate-600">{RETAKE_EXAM_TYPE_LABELS[r.exam_type]}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{r.annual_grade ?? '—'}</td>
                      <td className="px-3 py-2 text-center font-semibold text-slate-900">{r.exam_grade}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.result === 'kaloi' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {RETAKE_RESULT_LABELS[r.result]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500">{r.exam_date}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => remove(r)} aria-label={t('re.delete')} className="p-1.5 text-slate-300 hover:text-rose-600 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{t('re.new')}</h2>
              <button onClick={() => setShowModal(false)} aria-label={t('common.close')}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.student')}</label>
                <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                  <option value="">{t('re.pick_student')}</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.type')}</label>
                  <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value as RetakeExamType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="riprovim">{RETAKE_EXAM_TYPE_LABELS.riprovim}</option>
                    <option value="provim_klases">{RETAKE_EXAM_TYPE_LABELS.provim_klases}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.date')}</label>
                  <input required type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.annual')}</label>
                  <select value={form.annual_grade} onChange={(e) => setForm({ ...form, annual_grade: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.exam_grade')} *</label>
                  <select required value={form.exam_grade} onChange={(e) => setForm({ ...form, exam_grade: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              {form.exam_grade && (
                <p className="text-xs text-slate-500">
                  {t('re.result')}: <span className={Number(form.exam_grade) >= PASS_THRESHOLD ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                    {Number(form.exam_grade) >= PASS_THRESHOLD ? RETAKE_RESULT_LABELS.kaloi : RETAKE_RESULT_LABELS.ngeli}
                  </span>
                </p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('re.notes')}</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
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
