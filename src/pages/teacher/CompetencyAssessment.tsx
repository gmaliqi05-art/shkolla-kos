import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { logAudit } from '../../lib/audit';
import { Sparkles, Loader2, Save } from 'lucide-react';
import {
  COMPETENCY_LEVEL_LABELS, COMPETENCY_LEVEL_COLORS,
  type Competency, type CompetencyLevel,
} from '../../types/database';

interface ClassOption { id: string; name: string }
interface StudentOption { id: string; full_name: string }

const LEVELS: CompetencyLevel[] = ['fillestar', 'ne_zhvillim', 'i_arritur', 'i_avancuar'];

export default function CompetencyAssessment() {
  const { profile } = useAuth();
  const toast = useToast();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [period, setPeriod] = useState(1);
  const [levels, setLevels] = useState<Record<string, CompetencyLevel>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const init = async () => {
    if (!profile) return;
    setLoading(true);
    const [{ data: comps }, { data: hr }, { data: cs }] = await Promise.all([
      supabase.from('competencies').select('*').order('sort_order'),
      supabase.from('classes').select('id, name').eq('homeroom_teacher_id', profile.id),
      supabase.from('class_subjects').select('class_id').eq('teacher_id', profile.id),
    ]);
    setCompetencies(comps || []);
    const ids = new Set<string>((hr || []).map((c) => c.id));
    const extra = Array.from(new Set((cs || []).map((r) => r.class_id))).filter((id) => !ids.has(id));
    let merged: ClassOption[] = hr || [];
    if (extra.length > 0) {
      const { data: more } = await supabase.from('classes').select('id, name').in('id', extra);
      merged = [...merged, ...(more || [])];
    }
    merged.sort((a, b) => a.name.localeCompare(b.name));
    setClasses(merged);
    if (merged.length > 0) setSelectedClass(merged[0].id);
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const { data: enr } = await supabase.from('student_classes').select('student_id').eq('class_id', selectedClass);
      const ids = (enr || []).map((e) => e.student_id);
      if (ids.length === 0) { setStudents([]); setSelectedStudent(''); return; }
      const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids).is('deleted_at', null).order('full_name');
      setStudents(data || []);
      setSelectedStudent((data && data[0]?.id) || '');
    })();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedStudent) { setLevels({}); return; }
    (async () => {
      const { data } = await supabase
        .from('student_competency_assessments')
        .select('competency_id, level')
        .eq('student_id', selectedStudent)
        .eq('period', period);
      const map: Record<string, CompetencyLevel> = {};
      (data || []).forEach((r: { competency_id: string; level: CompetencyLevel }) => { map[r.competency_id] = r.level; });
      setLevels(map);
    })();
  }, [selectedStudent, period]);

  const save = async () => {
    if (!profile || !selectedStudent) return;
    const rows = Object.entries(levels).map(([competency_id, level]) => ({
      student_id: selectedStudent,
      competency_id,
      period,
      level,
      assessed_by: profile.id,
      assessed_at: new Date().toISOString(),
    }));
    if (rows.length === 0) { toast.error('Zgjidhni të paktën një nivel.'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('student_competency_assessments')
      .upsert(rows, { onConflict: 'student_id,competency_id,period' });
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      await logAudit({ actorId: profile.id, actorRole: profile.role, action: 'update', resourceType: 'competency_assessment', targetUserId: selectedStudent });
      toast.success('Vlerësimi u ruajt.');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vlerësimi sipas Kompetencave</h1>
          <p className="text-slate-500 text-sm">Korniza Kurrikulare e Kosovës — 7 kompetencat kryesore</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Klasa</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500">
            {classes.length === 0 && <option value="">Asnjë klasë</option>}
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nxënësi</label>
          <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500">
            {students.length === 0 && <option value="">Asnjë nxënës</option>}
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Periudha</label>
          <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500">
            <option value={1}>Periudha 1</option>
            <option value={2}>Periudha 2</option>
            <option value={3}>Periudha 3</option>
          </select>
        </div>
      </div>

      {selectedStudent ? (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {competencies.map((c) => (
            <div key={c.id} className="p-4">
              <p className="font-medium text-slate-900">{c.name}</p>
              {c.description && <p className="text-xs text-slate-500 mb-2">{c.description}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {LEVELS.map((lv) => (
                  <button key={lv} onClick={() => setLevels((m) => ({ ...m, [c.id]: lv }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      levels[c.id] === lv ? COMPETENCY_LEVEL_COLORS[lv] + ' border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}>
                    {COMPETENCY_LEVEL_LABELS[lv]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="p-4 flex justify-end">
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Ruaj vlerësimin
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
          Zgjidhni një klasë dhe një nxënës për të vlerësuar kompetencat.
        </div>
      )}
    </div>
  );
}
