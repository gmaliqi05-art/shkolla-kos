import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  BookOpen,
  Clock,
  Calendar,
  ClipboardCheck,
  CalendarDays,
  X,
  Check,
  ChevronDown,
  Search,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const CYCLE_LABELS: Record<string, { label: string; grades: number[]; color: string; bg: string; border: string }> = {
  ulet: {
    label: 'Cikli i Ulët',
    grades: [1, 2, 3],
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  mesem_ulet: {
    label: 'Cikli i Mesëm i Ulët',
    grades: [4, 5],
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  mesem_lart: {
    label: 'Cikli i Mesëm i Lartë',
    grades: [6, 7, 8, 9],
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

const CYCLE_FOR_GRADE = (g: number) => {
  if (g <= 3) return 'ulet';
  if (g <= 5) return 'mesem_ulet';
  return 'mesem_lart';
};

const GRADE_BADGE_COLORS: Record<number, string> = {
  1: 'bg-emerald-100 text-emerald-800',
  2: 'bg-emerald-100 text-emerald-800',
  3: 'bg-emerald-100 text-emerald-800',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-blue-100 text-blue-800',
  6: 'bg-amber-100 text-amber-800',
  7: 'bg-amber-100 text-amber-800',
  8: 'bg-amber-100 text-amber-800',
  9: 'bg-amber-100 text-amber-800',
};

interface SubjectGrade {
  id: string;
  subject_id: string;
  grade_level: number;
  hours_per_week: number;
  subject_name: string;
  subject_code: string;
  subject_description: string;
  is_active: boolean;
}

interface SubjectRow {
  id: string;
  name: string;
  code: string;
  description: string;
}

interface FormState {
  subject_id: string;
  grade_level: string;
  hours_per_week: string;
}

const EMPTY_FORM: FormState = {
  subject_id: '',
  grade_level: '1',
  hours_per_week: '2',
};

type ViewMode = 'grade' | 'cycle';

export default function SubjectsPage() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectRow[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grade');
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedCycle, setSelectedCycle] = useState<string>('ulet');

  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<SubjectGrade | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [isDemo]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    if (showModal) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  const loadData = async () => {
    if (isDemo) {
      setSubjectGrades(buildDemoData());
      setAllSubjects(DEMO_SUBJECTS);
      setLoading(false);
      return;
    }
    try {
      const [sgRes, subRes] = await Promise.all([
        supabase
          .from('subject_grades')
          .select('id, subject_id, grade_level, hours_per_week, subjects(name, code, description)')
          .order('grade_level')
          .order('subject_id'),
        supabase.from('subjects').select('id, name, code, description').order('name'),
      ]);

      if (sgRes.error) throw sgRes.error;
      if (subRes.error) throw subRes.error;

      setSubjectGrades(
        (sgRes.data || []).map((row: any) => ({
          id: row.id,
          subject_id: row.subject_id,
          grade_level: row.grade_level,
          hours_per_week: row.hours_per_week,
          subject_name: row.subjects?.name || '',
          subject_code: row.subjects?.code || '',
          subject_description: row.subjects?.description || '',
          is_active: true,
        }))
      );
      setAllSubjects(subRes.data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditEntry(null);
    setForm({ ...EMPTY_FORM, grade_level: String(selectedGrade) });
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (entry: SubjectGrade) => {
    setEditEntry(entry);
    setForm({
      subject_id: entry.subject_id,
      grade_level: String(entry.grade_level),
      hours_per_week: String(entry.hours_per_week),
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEntry(null);
    setFormError('');
  };

  const handleSave = async () => {
    if (!form.subject_id) { setFormError('Zgjidh lëndën.'); return; }
    if (!form.grade_level) { setFormError('Zgjidh klasën.'); return; }
    const hours = Number(form.hours_per_week);
    if (isNaN(hours) || hours < 1 || hours > 20) { setFormError('Orët/javë duhet të jenë 1–20.'); return; }

    if (isDemo) {
      if (editEntry) {
        const sub = DEMO_SUBJECTS.find(s => s.id === form.subject_id);
        setSubjectGrades(prev => prev.map(sg =>
          sg.id === editEntry.id
            ? { ...sg, subject_id: form.subject_id, grade_level: Number(form.grade_level), hours_per_week: hours, subject_name: sub?.name || sg.subject_name, subject_code: sub?.code || sg.subject_code }
            : sg
        ));
      } else {
        const sub = DEMO_SUBJECTS.find(s => s.id === form.subject_id);
        const newEntry: SubjectGrade = {
          id: `demo-${Date.now()}`,
          subject_id: form.subject_id,
          grade_level: Number(form.grade_level),
          hours_per_week: hours,
          subject_name: sub?.name || '',
          subject_code: sub?.code || '',
          subject_description: sub?.description || '',
          is_active: true,
        };
        setSubjectGrades(prev => [...prev, newEntry]);
      }
      closeModal();
      return;
    }

    setSaving(true);
    try {
      if (editEntry) {
        const { error } = await supabase
          .from('subject_grades')
          .update({ subject_id: form.subject_id, grade_level: Number(form.grade_level), hours_per_week: hours })
          .eq('id', editEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('subject_grades')
          .insert({ subject_id: form.subject_id, grade_level: Number(form.grade_level), hours_per_week: hours });
        if (error) throw error;
      }
      closeModal();
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gabim gjatë ruajtjes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: SubjectGrade) => {
    if (!confirm(`Fshij "${entry.subject_name}" nga Klasa ${entry.grade_level}?`)) return;
    if (isDemo) {
      setSubjectGrades(prev => prev.filter(sg => sg.id !== entry.id));
      return;
    }
    const { error } = await supabase.from('subject_grades').delete().eq('id', entry.id);
    if (error) { alert('Gabim: ' + error.message); return; }
    await loadData();
  };

  const handleToggle = (entry: SubjectGrade) => {
    setSubjectGrades(prev => prev.map(sg =>
      sg.id === entry.id ? { ...sg, is_active: !sg.is_active } : sg
    ));
  };

  const getFilteredForGrade = (grade: number) => {
    return subjectGrades
      .filter(sg => sg.grade_level === grade)
      .filter(sg => !search || sg.subject_name.toLowerCase().includes(search.toLowerCase()));
  };

  const getFilteredForCycle = (cycle: string) => {
    const grades = CYCLE_LABELS[cycle].grades;
    return subjectGrades
      .filter(sg => grades.includes(sg.grade_level))
      .filter(sg => !search || sg.subject_name.toLowerCase().includes(search.toLowerCase()));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const visibleItems = viewMode === 'grade'
    ? getFilteredForGrade(selectedGrade)
    : getFilteredForCycle(selectedCycle);

  const totalSubjectsForGrade = subjectGrades.filter(sg => sg.grade_level === selectedGrade).length;
  const totalHoursForGrade = subjectGrades
    .filter(sg => sg.grade_level === selectedGrade)
    .reduce((s, sg) => s + sg.hours_per_week, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lëndët Mësimore</h1>
          <p className="text-slate-500 mt-1">Kurrikula kosovare — Klasa 1 deri 9</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-700/20"
        >
          <Plus className="w-4 h-4" />
          Shto Lëndë
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => navigate('/mesues/orari')}
          className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-teal-200 hover:bg-teal-50 transition-all group text-left"
        >
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
            <CalendarDays className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Orari Mësimor</p>
            <p className="text-xs text-slate-500">Menaxho orarin sipas klasës</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/mesues/nota')}
          className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
            <ClipboardCheck className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Vendos Nota</p>
            <p className="text-xs text-slate-500">Regjistro notat e nxënësve</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/mesues/frekuentimi')}
          className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl hover:border-amber-200 hover:bg-amber-50 transition-all group text-left"
        >
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
            <Calendar className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Frekuentimi</p>
            <p className="text-xs text-slate-500">Shëno prezencën e nxënësve</p>
          </div>
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Kërko lëndën..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setViewMode('grade')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === 'grade' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Sipas Klasës
            </button>
            <button
              onClick={() => setViewMode('cycle')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                viewMode === 'cycle' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Sipas Ciklit
            </button>
          </div>
        </div>

        {viewMode === 'grade' && (
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => {
              const cycle = CYCLE_FOR_GRADE(g);
              const c = CYCLE_LABELS[cycle];
              const isSelected = selectedGrade === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : `${c.bg} ${c.color} ${c.border} hover:opacity-80`
                  }`}
                >
                  Klasa {g}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-white/70'}`}>
                    {subjectGrades.filter(sg => sg.grade_level === g).length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'cycle' && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(CYCLE_LABELS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setSelectedCycle(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  selectedCycle === key
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : `${val.bg} ${val.color} ${val.border} hover:opacity-80`
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                {val.label}
                <span className="text-xs font-semibold opacity-70">Kl. {val.grades[0]}–{val.grades[val.grades.length - 1]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewMode === 'grade' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-slate-900">{totalSubjectsForGrade}</p>
            <p className="text-xs text-slate-500 mt-1">Lëndë — Klasa {selectedGrade}</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-teal-700">{totalHoursForGrade}</p>
            <p className="text-xs text-teal-600 mt-1">Orë/javë</p>
          </div>
          <div className={`border rounded-2xl p-4 ${CYCLE_LABELS[CYCLE_FOR_GRADE(selectedGrade)].bg} ${CYCLE_LABELS[CYCLE_FOR_GRADE(selectedGrade)].border}`}>
            <p className={`text-sm font-bold ${CYCLE_LABELS[CYCLE_FOR_GRADE(selectedGrade)].color}`}>
              {CYCLE_LABELS[CYCLE_FOR_GRADE(selectedGrade)].label}
            </p>
            <p className="text-xs text-slate-500 mt-1">Cikli mësimor</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-2xl font-bold text-blue-700">
              {subjectGrades.filter(sg => sg.grade_level === selectedGrade && sg.is_active).length}
            </p>
            <p className="text-xs text-blue-600 mt-1">Aktive</p>
          </div>
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk u gjet asnjë lëndë</h3>
          <p className="text-slate-500 text-sm">
            {search ? 'Provo kërkim tjetër.' : 'Shtoni lëndën e parë duke klikuar "Shto Lëndë".'}
          </p>
        </div>
      ) : viewMode === 'grade' ? (
        <SubjectTable
          entries={visibleItems}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onNavigate={navigate}
        />
      ) : (
        <div className="space-y-6">
          {CYCLE_LABELS[selectedCycle].grades.map(grade => {
            const items = getFilteredForGrade(grade);
            if (items.length === 0) return null;
            const cycle = CYCLE_LABELS[CYCLE_FOR_GRADE(grade)];
            return (
              <div key={grade} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className={`px-6 py-3 flex items-center justify-between ${cycle.bg} border-b ${cycle.border}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${cycle.color}`}>Klasa {grade}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg border ${cycle.bg} ${cycle.color} ${cycle.border} font-medium`}>
                      {cycle.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{items.length} lëndë</span>
                    <span className="text-xs text-slate-500">
                      {items.reduce((s, i) => s + i.hours_per_week, 0)}h/javë
                    </span>
                  </div>
                </div>
                <SubjectTable
                  entries={items}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onNavigate={navigate}
                  compact
                />
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editEntry ? 'Ndrysho Lëndën' : 'Shto Lëndë të Re'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lënda <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.subject_id}
                    onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm appearance-none pr-10"
                  >
                    <option value="">-- Zgjidh Lëndën --</option>
                    {allSubjects.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Klasa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.grade_level}
                    onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm appearance-none pr-10"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>
                        Klasa {g} — {CYCLE_LABELS[CYCLE_FOR_GRADE(g)].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Orë në Javë <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.hours_per_week}
                  onChange={e => setForm(f => ({ ...f, hours_per_week: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm"
                />
                <p className="text-xs text-slate-400 mt-1">Numri i orëve mësimore në javë</p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Anulo
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Duke ruajtur...' : editEntry ? 'Ruaj' : 'Shto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SubjectTableProps {
  entries: SubjectGrade[];
  onEdit: (e: SubjectGrade) => void;
  onDelete: (e: SubjectGrade) => void;
  onToggle: (e: SubjectGrade) => void;
  onNavigate: (path: string) => void;
  compact?: boolean;
}

function SubjectTable({ entries, onEdit, onDelete, onToggle, onNavigate, compact }: SubjectTableProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${compact ? '' : ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lënda</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Kodi</th>
              {!compact && <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Klasa</th>}
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Orë/Javë</span>
                </div>
              </th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statusi</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entries.map(entry => (
              <tr
                key={entry.id}
                className={`transition-colors ${entry.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-50/70 opacity-60'}`}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${GRADE_BADGE_COLORS[entry.grade_level] || 'bg-slate-100 text-slate-700'}`}>
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${entry.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                        {entry.subject_name}
                      </p>
                      {entry.subject_description && (
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{entry.subject_description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden sm:table-cell">
                  <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono font-medium">
                    {entry.subject_code}
                  </span>
                </td>
                {!compact && (
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${GRADE_BADGE_COLORS[entry.grade_level]}`}>
                      Klasa {entry.grade_level}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">{entry.hours_per_week}</span>
                    <span className="text-xs text-slate-400">h</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ${
                    entry.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${entry.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {entry.is_active ? 'Aktive' : 'Joaktive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onNavigate('/mesues/orari')}
                      title="Shiko/Shto në Orar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-teal-50 hover:text-teal-600 transition-all"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggle(entry)}
                      title={entry.is_active ? 'Çaktivizo' : 'Aktivizo'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        entry.is_active
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {entry.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => onEdit(entry)}
                      title="Ndrysho"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(entry)}
                      title="Fshij"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const DEMO_SUBJECTS: SubjectRow[] = [
  { id: 'sb-1', name: 'Matematike', code: 'MAT', description: 'Matematika dhe gjeometria' },
  { id: 'sb-2', name: 'Gjuhe Shqipe', code: 'GJSH', description: 'Gjuha shqipe dhe letersia' },
  { id: 'sb-3', name: 'Fizike', code: 'FIZ', description: 'Fizika dhe eksperimentet' },
  { id: 'sb-4', name: 'Biologji', code: 'BIO', description: 'Biologjia dhe shkencat natyrore' },
  { id: 'sb-5', name: 'Kimi', code: 'KIM', description: 'Kimia dhe laboratori' },
  { id: 'sb-6', name: 'Anglisht', code: 'ANG', description: 'Gjuha angleze' },
  { id: 'sb-7', name: 'Histori', code: 'HIS', description: 'Historia e Shqiperise dhe botes' },
  { id: 'sb-8', name: 'Gjeografi', code: 'GJE', description: 'Gjeografia fizike dhe humane' },
  { id: 'sb-9', name: 'Edukim Fizik', code: 'EF', description: 'Edukimi fizik dhe sporti' },
  { id: 'sb-10', name: 'Art Pamor', code: 'ART', description: 'Arti pamor dhe vizatimi' },
  { id: 'sb-11', name: 'Muzike', code: 'MUZ', description: 'Edukimi muzikor' },
  { id: 'sb-12', name: 'TIK', code: 'TIK', description: 'Teknologjia e informacionit' },
  { id: 'sb-13', name: 'Natyra dhe Shoqeria', code: 'NSH', description: 'Natyra dhe shoqeria per klasa 1-3' },
  { id: 'sb-14', name: 'Edukate Qytetare', code: 'EQ', description: 'Edukate qytetare dhe te drejtat' },
  { id: 'sb-15', name: 'Gjermanisht', code: 'GJE2', description: 'Gjuha gjermane si gjuhe e dyte' },
  { id: 'sb-16', name: 'Shkencat e Natyres', code: 'SHN', description: 'Shkencat e natyres klasa 4-5' },
  { id: 'sb-17', name: 'Fete dhe Kultura', code: 'FK', description: 'Fete dhe kultura' },
];

function buildDemoData(): SubjectGrade[] {
  const curriculum: Record<number, { name: string; code: string; hours: number }[]> = {
    1: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 7 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Natyra dhe Shoqeria', code: 'NSH', hours: 3 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
    ],
    2: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 7 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Natyra dhe Shoqeria', code: 'NSH', hours: 3 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
    ],
    3: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 7 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Natyra dhe Shoqeria', code: 'NSH', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 2 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
    ],
    4: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 6 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Shkencat e Natyres', code: 'SHN', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
    5: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 5 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Shkencat e Natyres', code: 'SHN', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukate Qytetare', code: 'EQ', hours: 1 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
    6: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 4 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Biologji', code: 'BIO', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Gjermanisht', code: 'GJE2', hours: 2 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukate Qytetare', code: 'EQ', hours: 1 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
    7: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 4 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Biologji', code: 'BIO', hours: 2 },
      { name: 'Fizike', code: 'FIZ', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Gjermanisht', code: 'GJE2', hours: 2 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukate Qytetare', code: 'EQ', hours: 1 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
    8: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 4 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Biologji', code: 'BIO', hours: 2 },
      { name: 'Fizike', code: 'FIZ', hours: 2 },
      { name: 'Kimi', code: 'KIM', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Gjermanisht', code: 'GJE2', hours: 2 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukate Qytetare', code: 'EQ', hours: 1 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
    9: [
      { name: 'Gjuhe Shqipe', code: 'GJSH', hours: 4 },
      { name: 'Matematike', code: 'MAT', hours: 4 },
      { name: 'Biologji', code: 'BIO', hours: 2 },
      { name: 'Fizike', code: 'FIZ', hours: 2 },
      { name: 'Kimi', code: 'KIM', hours: 2 },
      { name: 'Anglisht', code: 'ANG', hours: 3 },
      { name: 'Gjermanisht', code: 'GJE2', hours: 2 },
      { name: 'Histori', code: 'HIS', hours: 2 },
      { name: 'Gjeografi', code: 'GJE', hours: 2 },
      { name: 'Edukate Qytetare', code: 'EQ', hours: 2 },
      { name: 'Edukim Fizik', code: 'EF', hours: 2 },
      { name: 'Art Pamor', code: 'ART', hours: 1 },
      { name: 'Muzike', code: 'MUZ', hours: 1 },
      { name: 'TIK', code: 'TIK', hours: 1 },
      { name: 'Fete dhe Kultura', code: 'FK', hours: 1 },
    ],
  };

  const result: SubjectGrade[] = [];
  Object.entries(curriculum).forEach(([grade, subjects]) => {
    subjects.forEach((s, idx) => {
      const sub = DEMO_SUBJECTS.find(ds => ds.code === s.code);
      result.push({
        id: `demo-${grade}-${idx}`,
        subject_id: sub?.id || `sb-${idx}`,
        grade_level: Number(grade),
        hours_per_week: s.hours,
        subject_name: s.name,
        subject_code: s.code,
        subject_description: sub?.description || '',
        is_active: true,
      });
    });
  });
  return result;
}
