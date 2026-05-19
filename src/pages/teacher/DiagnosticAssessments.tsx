import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Stethoscope, Edit2, X, Save } from 'lucide-react';
import {
  STARTING_LEVEL_LABELS,
  STARTING_LEVEL_COLORS,
  type StartingLevel,
  type DiagnosticAssessment,
} from '../../types/database';

interface ClassOption { id: string; name: string }
interface SubjectOption { id: string; name: string }
interface StudentRow {
  id: string;
  full_name: string;
  diagnostic?: DiagnosticAssessment;
}

export default function DiagnosticAssessments() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ student: StudentRow } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    starting_level: '' as StartingLevel | '',
    strengths: '',
    weaknesses: '',
    recommended_actions: '',
    assessment_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClass && selectedSubject) loadStudents();
  }, [selectedClass, selectedSubject]);

  const load = async () => {
    if (!profile) return;
    const ids = new Set<string>();
    const { data: hr } = await supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.id);
    hr?.forEach((c) => ids.add(c.id));
    const { data: cs } = await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id);
    cs?.forEach((c: { class_id: string }) => ids.add(c.class_id));
    if (ids.size > 0) {
      const { data: cls } = await supabase.from('classes').select('id, name').in('id', Array.from(ids)).order('name');
      setClasses(cls || []);
      if (cls && cls.length > 0) setSelectedClass(cls[0].id);
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
    if (subs.length > 0) setSelectedSubject(subs[0].id);
    setLoading(false);
  };

  const loadStudents = async () => {
    setLoading(true);
    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id')
      .eq('class_id', selectedClass);
    const studentIds = (enrolls || []).map((e) => e.student_id);
    if (studentIds.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }
    const [profilesRes, diagRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds).is('deleted_at', null).order('full_name'),
      supabase.from('diagnostic_assessments').select('*').in('student_id', studentIds).eq('subject_id', selectedSubject),
    ]);
    const diagMap = new Map<string, DiagnosticAssessment>();
    (diagRes.data || []).forEach((d: DiagnosticAssessment) => diagMap.set(d.student_id, d));
    setStudents((profilesRes.data || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      diagnostic: diagMap.get(p.id),
    })));
    setLoading(false);
  };

  const openEdit = (student: StudentRow) => {
    setEditing({ student });
    setForm({
      starting_level: student.diagnostic?.starting_level || '',
      strengths: student.diagnostic?.strengths || '',
      weaknesses: student.diagnostic?.weaknesses || '',
      recommended_actions: student.diagnostic?.recommended_actions || '',
      assessment_date: student.diagnostic?.assessment_date || new Date().toISOString().slice(0, 10),
    });
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      student_id: editing.student.id,
      class_id: selectedClass,
      subject_id: selectedSubject,
      teacher_id: profile.id,
      starting_level: form.starting_level || null,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      recommended_actions: form.recommended_actions,
      assessment_date: form.assessment_date,
    };
    const res = editing.student.diagnostic
      ? await supabase.from('diagnostic_assessments').update(payload).eq('id', editing.student.diagnostic.id)
      : await supabase.from('diagnostic_assessments').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setEditing(null);
      loadStudents();
    }
    setSubmitting(false);
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vlerësimi Diagnostikues</h1>
          <p className="text-slate-500 text-sm">Sipas UA 06/2022 — gjendja fillestare e nxënësit në fillim të vitit</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Klasa</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Lënda</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Asnjë nxënës në këtë klasë.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2">Nxënësi</th>
                <th className="px-4 py-2">Niveli fillestar</th>
                <th className="px-4 py-2">Data e vlerësimit</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{s.full_name}</td>
                  <td className="px-4 py-2">
                    {s.diagnostic?.starting_level ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STARTING_LEVEL_COLORS[s.diagnostic.starting_level]}`}>
                        {STARTING_LEVEL_LABELS[s.diagnostic.starting_level]}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">Pa vlerësuar</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s.diagnostic?.assessment_date || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-700 hover:bg-purple-100 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                      {s.diagnostic ? 'Edito' : 'Shto'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Vlerësimi për {editing.student.full_name}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveli fillestar *</label>
                  <select required value={form.starting_level} onChange={(e) => setForm({ ...form, starting_level: e.target.value as StartingLevel | '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">— Zgjidh —</option>
                    {(Object.keys(STARTING_LEVEL_LABELS) as StartingLevel[]).map((l) => (
                      <option key={l} value={l}>{STARTING_LEVEL_LABELS[l]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" value={form.assessment_date} onChange={(e) => setForm({ ...form, assessment_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pikat e forta</label>
                <textarea rows={2} value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} placeholder="Çfarë e bën nxënësin/en të suksesshëm/me?" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pikat e dobëta</label>
                <textarea rows={2} value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} placeholder="Ku ka vështirësi?" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Veprimet e rekomanduara</label>
                <textarea rows={3} value={form.recommended_actions} onChange={(e) => setForm({ ...form, recommended_actions: e.target.value })} placeholder="Çfarë do bëhet për të mbështetur progresin?" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
