import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, BookOpen, Edit2, Save, X } from 'lucide-react';
import type { ClassJournalEntry } from '../../types/database';

interface ClassOption { id: string; name: string }
interface SubjectOption { id: string; name: string }
interface JournalEntryRow extends ClassJournalEntry {
  subject_name?: string;
}

export default function ClassDiary() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [entries, setEntries] = useState<JournalEntryRow[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassJournalEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    subject_id: '',
    date: new Date().toISOString().slice(0, 10),
    lesson_number: '1',
    topic: '',
    homework: '',
    notes: '',
  });

  useEffect(() => {
    if (profile?.id) loadClasses();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedClass) loadEntries();
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    if (!profile) return;
    const ids = new Set<string>();
    const { data: hr } = await supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.id);
    hr?.forEach((c) => ids.add(c.id));
    const { data: cs } = await supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id);
    cs?.forEach((c: { class_id: string }) => ids.add(c.class_id));
    if (ids.size === 0) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('classes').select('id, name').in('id', Array.from(ids)).order('name');
    setClasses(data || []);
    if (data && data.length > 0) setSelectedClass(data[0].id);

    // Load subjects the teacher teaches in any class
    const { data: cs2 } = await supabase
      .from('class_subjects')
      .select('subject_id, subjects(id, name)')
      .eq('teacher_id', profile.id);
    type Row = { subject_id: string; subjects: { id: string; name: string } | null };
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
  };

  const loadEntries = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('class_journal')
      .select('*')
      .eq('class_id', selectedClass)
      .eq('date', selectedDate)
      .order('lesson_number');

    const items: ClassJournalEntry[] = data || [];
    const subjectIds = Array.from(new Set(items.map((e) => e.subject_id)));
    const { data: subs } = subjectIds.length > 0
      ? await supabase.from('subjects').select('id, name').in('id', subjectIds)
      : { data: [] };
    const sMap = new Map((subs || []).map((s) => [s.id, s.name]));

    setEntries(items.map((e) => ({ ...e, subject_name: sMap.get(e.subject_id) })));
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      subject_id: subjects[0]?.id || '',
      date: selectedDate,
      lesson_number: String((entries.length || 0) + 1),
      topic: '',
      homework: '',
      notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (e: ClassJournalEntry) => {
    setEditing(e);
    setForm({
      subject_id: e.subject_id,
      date: e.date,
      lesson_number: e.lesson_number ? String(e.lesson_number) : '',
      topic: e.topic,
      homework: e.homework,
      notes: e.notes,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      class_id: selectedClass,
      subject_id: form.subject_id,
      teacher_id: profile.id,
      date: form.date,
      lesson_number: form.lesson_number ? Number(form.lesson_number) : null,
      topic: form.topic,
      homework: form.homework,
      notes: form.notes,
    };
    const res = editing
      ? await supabase.from('class_journal').update(payload).eq('id', editing.id)
      : await supabase.from('class_journal').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      loadEntries();
    }
    setSubmitting(false);
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Nuk keni asnjë klasë. Drejtori duhet t'ju caktojë te një klasë.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ditari i Klasës</h1>
            <p className="text-slate-500 text-sm">UA 19/2018 — regjistër ditor i orëve të mbajtura</p>
          </div>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">
          <Plus className="w-4 h-4" />
          Shto Orë
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Klasa</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Data</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {entries.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë orë e regjistruar për këtë datë. Klik "Shto Orë" për të filluar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2 w-16">Ora</th>
                <th className="px-4 py-2">Lënda</th>
                <th className="px-4 py-2">Tema</th>
                <th className="px-4 py-2">Detyrë shtëpie</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-slate-700">{e.lesson_number || '—'}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{e.subject_name}</td>
                  <td className="px-4 py-2 text-slate-700">{e.topic}</td>
                  <td className="px-4 py-2 text-slate-600">{e.homework || <span className="text-slate-400 italic">pa detyrë</span>}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => openEdit(e)} className="p-1 text-slate-400 hover:text-slate-700">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Orën' : 'Regjistro Orë'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ora (numri)</label>
                  <input type="number" min="1" max="8" value={form.lesson_number} onChange={(e) => setForm({ ...form, lesson_number: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lënda *</label>
                <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Zgjidh —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tema *</label>
                <input required type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Çfarë u trajtua në mësim" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Detyrë shtëpie</label>
                <textarea rows={2} value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shënime</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
