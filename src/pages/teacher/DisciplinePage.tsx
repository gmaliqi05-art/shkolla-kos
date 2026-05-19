import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, X, AlertTriangle, Shield } from 'lucide-react';
import {
  DISCIPLINARY_ACTION_LABELS,
  DISCIPLINARY_STATUS_LABELS,
  type DisciplinaryActionType,
  type DisciplinaryAction,
} from '../../types/database';

interface ClassOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  full_name: string;
}

interface ActionWithStudent extends DisciplinaryAction {
  student_name?: string;
  class_name?: string;
}

const TEACHER_ALLOWED_TYPES: DisciplinaryActionType[] = ['verejtje_goje', 'verejtje_shkrim'];

export default function DisciplinePage() {
  const { profile } = useAuth();
  const isDirector = profile?.role === 'drejtor';
  const allowedTypes = isDirector
    ? (Object.keys(DISCIPLINARY_ACTION_LABELS) as DisciplinaryActionType[])
    : TEACHER_ALLOWED_TYPES;

  const [actions, setActions] = useState<ActionWithStudent[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    student_id: '',
    class_id: '',
    action_type: TEACHER_ALLOWED_TYPES[0] as DisciplinaryActionType,
    description: '',
    action_date: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    loadAll();
  }, [profile?.id]);

  const loadAll = async () => {
    await Promise.all([loadActions(), loadClasses()]);
    setLoading(false);
  };

  const loadClasses = async () => {
    if (!profile) return;
    if (isDirector) {
      const { data } = await supabase
        .from('classes')
        .select('id, name')
        .order('grade_level')
        .order('section');
      setClasses(data || []);
      return;
    }
    const ids = new Set<string>();
    const { data: homeroom } = await supabase
      .from('classes')
      .select('id, name')
      .eq('homeroom_teacher_id', profile.id);
    homeroom?.forEach((c) => ids.add(c.id));
    const { data: assigned } = await supabase
      .from('class_subjects')
      .select('class_id')
      .eq('teacher_id', profile.id);
    assigned?.forEach((c: { class_id: string }) => ids.add(c.class_id));
    if (ids.size === 0) {
      setClasses([]);
      return;
    }
    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', Array.from(ids))
      .order('grade_level')
      .order('section');
    setClasses(data || []);
  };

  const loadStudentsForClass = async (classId: string) => {
    if (!classId) {
      setStudents([]);
      return;
    }
    const { data: enrolls } = await supabase
      .from('student_classes')
      .select('student_id')
      .eq('class_id', classId);
    const ids = (enrolls || []).map((e) => e.student_id);
    if (ids.length === 0) {
      setStudents([]);
      return;
    }
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids);
    const list: StudentOption[] = (profilesData || [])
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    setStudents(list);
  };

  const loadActions = async () => {
    const { data } = await supabase
      .from('disciplinary_actions')
      .select('*')
      .order('action_date', { ascending: false })
      .limit(100);
    const items: DisciplinaryAction[] = data || [];
    if (items.length === 0) {
      setActions([]);
      return;
    }
    const studentIds = Array.from(new Set(items.map((a) => a.student_id)));
    const classIds = Array.from(new Set(items.map((a) => a.class_id).filter((id): id is string => !!id)));
    const [profilesRes, classesRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      classIds.length > 0
        ? supabase.from('classes').select('id, name').in('id', classIds)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    ]);
    const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name]));
    const classMap = new Map((classesRes.data || []).map((c) => [c.id, c.name]));
    const mapped: ActionWithStudent[] = items.map((a) => ({
      ...a,
      student_name: profileMap.get(a.student_id) || '',
      class_name: (a.class_id && classMap.get(a.class_id)) || '',
    }));
    setActions(mapped);
  };

  const openModal = () => {
    setError('');
    setForm({
      student_id: '',
      class_id: '',
      action_type: allowedTypes[0],
      description: '',
      action_date: new Date().toISOString().slice(0, 10),
    });
    setStudents([]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    if (!form.student_id || !form.description.trim()) {
      setError('Nxënësi dhe përshkrimi janë të detyrueshëm.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('disciplinary_actions').insert({
      student_id: form.student_id,
      class_id: form.class_id || null,
      action_type: form.action_type,
      description: form.description,
      action_date: form.action_date,
      issued_by: profile.id,
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setShowModal(false);
      loadActions();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Masat Disiplinore</h1>
            <p className="text-slate-500 text-sm">
              {isDirector
                ? 'Menaxhim i plotë i masave disiplinore'
                : 'Vërejtje me gojë dhe me shkrim (masat e rënda vendosen nga drejtori)'}
            </p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Shto Masë
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : actions.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë masë disiplinore e regjistruar.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Nxënësi</th>
                <th className="px-6 py-3">Klasa</th>
                <th className="px-6 py-3">Masa</th>
                <th className="px-6 py-3">Përshkrimi</th>
                <th className="px-6 py-3">Statusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {actions.map((a) => (
                <tr key={a.id}>
                  <td className="px-6 py-3 text-sm text-slate-600">{a.action_date}</td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">{a.student_name || '—'}</td>
                  <td className="px-6 py-3 text-sm text-slate-600">{a.class_name || '—'}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700">
                      <AlertTriangle className="w-3 h-3" />
                      {DISCIPLINARY_ACTION_LABELS[a.action_type]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-600 max-w-xs truncate">{a.description}</td>
                  <td className="px-6 py-3 text-xs text-slate-500">{DISCIPLINARY_STATUS_LABELS[a.status]}</td>
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
              <h2 className="text-lg font-bold text-slate-900">Shto Masë Disiplinore</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Klasa</label>
                <select
                  required
                  value={form.class_id}
                  onChange={(e) => {
                    setForm({ ...form, class_id: e.target.value, student_id: '' });
                    loadStudentsForClass(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">— Zgjidh klasën —</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nxënësi *</label>
                <select
                  required
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  disabled={!form.class_id}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-50"
                >
                  <option value="">— Zgjidh nxënësin —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lloji i masës *</label>
                <select
                  required
                  value={form.action_type}
                  onChange={(e) => setForm({ ...form, action_type: e.target.value as DisciplinaryActionType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {allowedTypes.map((t) => (
                    <option key={t} value={t}>{DISCIPLINARY_ACTION_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={form.action_date}
                  onChange={(e) => setForm({ ...form, action_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  placeholder="Përshkruani arsyen e masës disiplinore..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
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
