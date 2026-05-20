import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, FileText, X, ChevronDown, ChevronRight, Clock } from 'lucide-react';
import {
  HOMEWORK_SUBMISSION_STATUS_LABELS,
  type Homework,
  type HomeworkSubmission,
  type HomeworkSubmissionStatus,
} from '../../types/database';

interface ClassOption { id: string; name: string }
interface SubjectOption { id: string; name: string }

interface HomeworkRow extends Homework {
  class_name?: string;
  subject_name?: string;
  submission_count?: number;
  graded_count?: number;
}

const STATUS_COLORS: Record<HomeworkSubmissionStatus, string> = {
  pa_dorezuar: 'bg-slate-100 text-slate-600',
  dorezuar: 'bg-blue-100 text-blue-700',
  vleresuar: 'bg-emerald-100 text-emerald-700',
  me_vonese: 'bg-amber-100 text-amber-700',
};

export default function HomeworkPage() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkRow[]>([]);
  const [submissions, setSubmissions] = useState<Map<string, HomeworkSubmission[]>>(new Map());
  const [students, setStudents] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    class_id: '',
    subject_id: '',
    title: '',
    description: '',
    assigned_date: new Date().toISOString().slice(0, 10),
    due_date: '',
  });

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile) return;
    setLoading(true);

    const ids = new Set<string>();
    const { data: hr } = await supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.id);
    hr?.forEach((c) => ids.add(c.id));
    const { data: cs } = await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id);
    cs?.forEach((c: { class_id: string }) => ids.add(c.class_id));

    if (ids.size > 0) {
      const { data: cls } = await supabase.from('classes').select('id, name').in('id', Array.from(ids)).order('name');
      setClasses(cls || []);
    }

    const { data: cs2 } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('teacher_id', profile.id);
    type Row = { subjects: { id: string; name: string } | null };
    const seen = new Set<string>();
    const subs: SubjectOption[] = [];
    (cs2 || []).forEach((row) => {
      const r = row as unknown as Row;
      if (r.subjects && !seen.has(r.subjects.id)) {
        seen.add(r.subjects.id);
        subs.push(r.subjects);
      }
    });
    setSubjects(subs.sort((a, b) => a.name.localeCompare(b.name)));

    const { data: hws } = await supabase
      .from('homework')
      .select('*')
      .eq('teacher_id', profile.id)
      .order('assigned_date', { ascending: false });

    const list: Homework[] = hws || [];
    const cMap = new Map<string, string>();
    const sMap = new Map<string, string>();
    if (list.length > 0) {
      const classIds = Array.from(new Set(list.map((h) => h.class_id)));
      const subjectIds = Array.from(new Set(list.map((h) => h.subject_id)));
      const { data: cls } = await supabase.from('classes').select('id, name').in('id', classIds);
      cls?.forEach((c) => cMap.set(c.id, c.name));
      const { data: subs2 } = await supabase.from('subjects').select('id, name').in('id', subjectIds);
      subs2?.forEach((s) => sMap.set(s.id, s.name));

      const hwIds = list.map((h) => h.id);
      const { data: subm } = await supabase.from('homework_submissions').select('*').in('homework_id', hwIds);
      const subMap = new Map<string, HomeworkSubmission[]>();
      const studentIds = new Set<string>();
      (subm || []).forEach((s: HomeworkSubmission) => {
        const arr = subMap.get(s.homework_id) || [];
        arr.push(s);
        subMap.set(s.homework_id, arr);
        studentIds.add(s.student_id);
      });
      setSubmissions(subMap);

      if (studentIds.size > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', Array.from(studentIds));
        const stMap = new Map<string, string>();
        profiles?.forEach((p) => stMap.set(p.id, p.full_name));
        setStudents(stMap);
      }

      setHomeworks(list.map((h) => {
        const subs = subMap.get(h.id) || [];
        return {
          ...h,
          class_name: cMap.get(h.class_id),
          subject_name: sMap.get(h.subject_id),
          submission_count: subs.length,
          graded_count: subs.filter((s) => s.status === 'vleresuar').length,
        };
      }));
    } else {
      setHomeworks([]);
    }
    setLoading(false);
  };

  const openNew = () => {
    setForm({
      class_id: classes[0]?.id || '',
      subject_id: subjects[0]?.id || '',
      title: '',
      description: '',
      assigned_date: new Date().toISOString().slice(0, 10),
      due_date: '',
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('homework').insert({
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: profile.id,
      title: form.title,
      description: form.description,
      assigned_date: form.assigned_date,
      due_date: form.due_date || null,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Detyrat e Shtëpisë</h1>
            <p className="text-slate-500 text-sm">Caktoni detyra dhe vlerësoni dorëzimet</p>
          </div>
        </div>
        <button onClick={openNew} disabled={classes.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50">
          <Plus className="w-4 h-4" />
          Cakto Detyrë
        </button>
      </div>

      {homeworks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë detyrë e caktuar ende.
        </div>
      ) : (
        <div className="space-y-3">
          {homeworks.map((h) => {
            const isOpen = expanded === h.id;
            const subs = submissions.get(h.id) || [];
            return (
              <div key={h.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">{h.subject_name}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{h.class_name}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1">{h.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Caktuar: {h.assigned_date}
                      {h.due_date && ` · Dorëzimi deri: ${h.due_date}`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {h.submission_count} dorëzime · {h.graded_count} të vlerësuara
                    </p>
                    {h.description && <p className="text-sm text-slate-600 mt-2 italic">{h.description}</p>}
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : h.id)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Dorëzimet e nxënësve</h4>
                    {subs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Asnjë dorëzim ende.</p>
                    ) : (
                      <ul className="space-y-1">
                        {subs.map((s) => (
                          <li key={s.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
                            <span className="font-medium text-slate-900">{students.get(s.student_id) || '—'}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[s.status]}`}>
                              {HOMEWORK_SUBMISSION_STATUS_LABELS[s.status]}
                            </span>
                            {s.grade !== null && <span className="text-xs font-mono text-slate-700">Notë: {s.grade}</span>}
                            {s.submitted_at && (
                              <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(s.submitted_at).toLocaleDateString('sq-AL')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Detyrë e Re</h2>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Klasa *</label>
                  <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">— Zgjidh —</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lënda *</label>
                  <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">— Zgjidh —</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi i detyrës</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e caktimit *</label>
                  <input required type="date" value={form.assigned_date} onChange={(e) => setForm({ ...form, assigned_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dorëzimi deri</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cakto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
