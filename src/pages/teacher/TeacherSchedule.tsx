import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Calendar,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

const DAYS: Record<number, string> = {
  1: 'E Hënë',
  2: 'E Martë',
  3: 'E Mërkurë',
  4: 'E Enjte',
  5: 'E Premte',
};

const DAY_HEADER_COLORS: Record<number, string> = {
  1: 'bg-blue-600',
  2: 'bg-emerald-600',
  3: 'bg-amber-500',
  4: 'bg-rose-600',
  5: 'bg-teal-600',
};

// Kosovo curriculum subjects per grade level
const KOSOVO_SUBJECTS: Record<number, { name: string; hours: number }[]> = {
  1: [
    { name: 'Gjuhe Shqipe', hours: 7 },
    { name: 'Matematike', hours: 4 },
    { name: 'Natyra dhe Shoqeria', hours: 3 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
  ],
  2: [
    { name: 'Gjuhe Shqipe', hours: 7 },
    { name: 'Matematike', hours: 4 },
    { name: 'Natyra dhe Shoqeria', hours: 3 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
  ],
  3: [
    { name: 'Gjuhe Shqipe', hours: 7 },
    { name: 'Matematike', hours: 4 },
    { name: 'Natyra dhe Shoqeria', hours: 2 },
    { name: 'Anglisht', hours: 2 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
  ],
  4: [
    { name: 'Gjuhe Shqipe', hours: 6 },
    { name: 'Matematike', hours: 4 },
    { name: 'Shkencat e Natyres', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
  5: [
    { name: 'Gjuhe Shqipe', hours: 5 },
    { name: 'Matematike', hours: 4 },
    { name: 'Shkencat e Natyres', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukate Qytetare', hours: 1 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
  6: [
    { name: 'Gjuhe Shqipe', hours: 4 },
    { name: 'Matematike', hours: 4 },
    { name: 'Biologji', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Gjermanisht', hours: 2 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukate Qytetare', hours: 1 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
  7: [
    { name: 'Gjuhe Shqipe', hours: 4 },
    { name: 'Matematike', hours: 4 },
    { name: 'Biologji', hours: 2 },
    { name: 'Fizike', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Gjermanisht', hours: 2 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukate Qytetare', hours: 1 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
  8: [
    { name: 'Gjuhe Shqipe', hours: 4 },
    { name: 'Matematike', hours: 4 },
    { name: 'Biologji', hours: 2 },
    { name: 'Fizike', hours: 2 },
    { name: 'Kimi', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Gjermanisht', hours: 2 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukate Qytetare', hours: 1 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
  9: [
    { name: 'Gjuhe Shqipe', hours: 4 },
    { name: 'Matematike', hours: 4 },
    { name: 'Biologji', hours: 2 },
    { name: 'Fizike', hours: 2 },
    { name: 'Kimi', hours: 2 },
    { name: 'Anglisht', hours: 3 },
    { name: 'Gjermanisht', hours: 2 },
    { name: 'Histori', hours: 2 },
    { name: 'Gjeografi', hours: 2 },
    { name: 'Edukate Qytetare', hours: 2 },
    { name: 'Edukim Fizik', hours: 2 },
    { name: 'Art Pamor', hours: 1 },
    { name: 'Muzike', hours: 1 },
    { name: 'TIK', hours: 1 },
    { name: 'Fete dhe Kultura', hours: 1 },
  ],
};

interface ClassOption {
  id: string;
  name: string;
  grade_level: number;
}

interface SubjectOption {
  id: string;
  name: string;
  hours_per_week?: number;
}

interface ScheduleEntry {
  id: string;
  class_id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  is_active: boolean;
  class_name: string;
  subject_name: string;
}

interface ScheduleForm {
  class_id: string;
  subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string;
}

const EMPTY_FORM: ScheduleForm = {
  class_id: '',
  subject_id: '',
  day_of_week: '1',
  start_time: '08:00',
  end_time: '08:45',
  room: '',
};

export default function TeacherSchedule() {
  const { profile, isDemo } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [gradeSubjects, setGradeSubjects] = useState<SubjectOption[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<ScheduleEntry | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadClasses();
    loadSubjects();
  }, [profile]);

  useEffect(() => {
    if (selectedClassId) {
      loadScheduleForClass(selectedClassId);
      const cls = allClasses.find(c => c.id === selectedClassId);
      if (cls) {
        setGradeSubjects(getSubjectsForGrade(cls.grade_level));
      }
    } else {
      setSchedule([]);
    }
  }, [selectedClassId, allClasses]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal();
    }
    if (showModal) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  const getSubjectsForGrade = (grade: number): SubjectOption[] => {
    const curriculumSubjects = KOSOVO_SUBJECTS[grade] || [];
    return curriculumSubjects.map(cs => {
      const found = allSubjects.find(s => s.name === cs.name);
      return {
        id: found?.id || cs.name,
        name: cs.name,
        hours_per_week: cs.hours,
      };
    });
  };

  const loadClasses = async () => {
    if (isDemo) {
      setAllClasses([
        { id: 'cl-1', name: 'Klasa 5-A', grade_level: 5 },
        { id: 'cl-2', name: 'Klasa 7-A', grade_level: 7 },
        { id: 'cl-3', name: 'Klasa 8-A', grade_level: 8 },
      ]);
      setSelectedClassId('cl-1');
      setLoading(false);
      return;
    }
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select('class_id, classes(id, name, grade_level)')
        .eq('teacher_id', profile.id);
      if (error) throw error;

      const seen = new Set<string>();
      const classes: ClassOption[] = [];
      (data || []).forEach((row: any) => {
        const c = row.classes;
        if (c && !seen.has(c.id)) {
          seen.add(c.id);
          classes.push({ id: c.id, name: c.name, grade_level: c.grade_level });
        }
      });
      classes.sort((a, b) => a.grade_level - b.grade_level || a.name.localeCompare(b.name));
      setAllClasses(classes);
      if (classes.length > 0) setSelectedClassId(classes[0].id);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    if (isDemo) {
      setAllSubjects([
        { id: 'sb-1', name: 'Matematike' },
        { id: 'sb-2', name: 'Gjuhe Shqipe' },
        { id: 'sb-3', name: 'Fizike' },
        { id: 'sb-4', name: 'Biologji' },
        { id: 'sb-5', name: 'Kimi' },
        { id: 'sb-6', name: 'Anglisht' },
        { id: 'sb-7', name: 'Histori' },
        { id: 'sb-8', name: 'Gjeografi' },
        { id: 'sb-9', name: 'Edukim Fizik' },
        { id: 'sb-10', name: 'Art Pamor' },
        { id: 'sb-11', name: 'Muzike' },
        { id: 'sb-12', name: 'TIK' },
        { id: 'sb-13', name: 'Natyra dhe Shoqeria' },
        { id: 'sb-14', name: 'Edukate Qytetare' },
        { id: 'sb-15', name: 'Gjermanisht' },
        { id: 'sb-16', name: 'Shkencat e Natyres' },
        { id: 'sb-17', name: 'Fete dhe Kultura' },
      ]);
      return;
    }
    try {
      const { data, error } = await supabase.from('subjects').select('id, name').order('name');
      if (error) throw error;
      setAllSubjects(data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  const loadScheduleForClass = async (classId: string) => {
    if (isDemo) {
      const demoSchedule: Record<string, ScheduleEntry[]> = {
        'cl-1': [
          { id: 's1', class_id: 'cl-1', subject_id: 'sb-1', day_of_week: 1, start_time: '08:00', end_time: '08:45', room: 'Salla 12', is_active: true, class_name: 'Klasa 5-A', subject_name: 'Matematike' },
          { id: 's2', class_id: 'cl-1', subject_id: 'sb-2', day_of_week: 1, start_time: '08:50', end_time: '09:35', room: 'Salla 12', is_active: true, class_name: 'Klasa 5-A', subject_name: 'Gjuhe Shqipe' },
          { id: 's3', class_id: 'cl-1', subject_id: 'sb-6', day_of_week: 2, start_time: '10:00', end_time: '10:45', room: 'Salla 5', is_active: true, class_name: 'Klasa 5-A', subject_name: 'Anglisht' },
          { id: 's4', class_id: 'cl-1', subject_id: 'sb-1', day_of_week: 3, start_time: '08:00', end_time: '08:45', room: 'Salla 12', is_active: false, class_name: 'Klasa 5-A', subject_name: 'Matematike' },
        ],
        'cl-2': [
          { id: 's5', class_id: 'cl-2', subject_id: 'sb-1', day_of_week: 1, start_time: '09:50', end_time: '10:35', room: 'Salla 12', is_active: true, class_name: 'Klasa 7-A', subject_name: 'Matematike' },
          { id: 's6', class_id: 'cl-2', subject_id: 'sb-3', day_of_week: 2, start_time: '08:00', end_time: '08:45', room: 'Lab. Fizikes', is_active: true, class_name: 'Klasa 7-A', subject_name: 'Fizike' },
        ],
        'cl-3': [
          { id: 's7', class_id: 'cl-3', subject_id: 'sb-3', day_of_week: 3, start_time: '09:50', end_time: '10:35', room: 'Lab. Fizikes', is_active: true, class_name: 'Klasa 8-A', subject_name: 'Fizike' },
        ],
      };
      setSchedule(demoSchedule[classId] || []);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedule')
        .select('id, class_id, subject_id, day_of_week, start_time, end_time, room, is_active, classes(name), subjects(name)')
        .eq('class_id', classId)
        .eq('teacher_id', profile!.id)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;

      setSchedule(
        (data || []).map((s: any) => ({
          id: s.id,
          class_id: s.class_id,
          subject_id: s.subject_id,
          day_of_week: s.day_of_week,
          start_time: s.start_time.substring(0, 5),
          end_time: s.end_time.substring(0, 5),
          room: s.room || '',
          is_active: s.is_active,
          class_name: s.classes?.name || '',
          subject_name: s.subjects?.name || '',
        }))
      );
    } catch (err) {
      console.error('Error loading schedule:', err);
    }
  };

  const openAddModal = () => {
    setEditEntry(null);
    setForm({
      ...EMPTY_FORM,
      class_id: selectedClassId,
      subject_id: gradeSubjects[0]?.id || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (entry: ScheduleEntry) => {
    setEditEntry(entry);
    setForm({
      class_id: entry.class_id,
      subject_id: entry.subject_id,
      day_of_week: String(entry.day_of_week),
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room,
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEntry(null);
    setFormError('');
  };

  const validate = (): boolean => {
    if (!form.class_id) { setFormError('Zgjidh klasen.'); return false; }
    if (!form.subject_id) { setFormError('Zgjidh lenden.'); return false; }
    if (!form.start_time || !form.end_time) { setFormError('Vendos oren e fillimit dhe mbarimit.'); return false; }
    if (form.start_time >= form.end_time) { setFormError('Ora e fillimit duhet te jete para ores se mbarimit.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (isDemo) { closeModal(); return; }
    if (!validate()) return;

    setSaving(true);
    const payload = {
      class_id: form.class_id,
      subject_id: form.subject_id,
      teacher_id: profile!.id,
      day_of_week: Number(form.day_of_week),
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim(),
    };

    try {
      if (editEntry) {
        const { error } = await supabase.from('schedule').update(payload).eq('id', editEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('schedule').insert(payload);
        if (error) throw error;
      }
      closeModal();
      await loadScheduleForClass(selectedClassId);
    } catch (err: any) {
      setFormError(err.message || 'Gabim gjate ruajtjes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entry: ScheduleEntry) => {
    if (!confirm(`Fshij "${entry.subject_name} - ${DAYS[entry.day_of_week]}"?`)) return;
    if (isDemo) {
      setSchedule(prev => prev.filter(s => s.id !== entry.id));
      return;
    }
    const { error } = await supabase.from('schedule').delete().eq('id', entry.id);
    if (error) { alert('Gabim: ' + error.message); return; }
    await loadScheduleForClass(selectedClassId);
  };

  const handleToggle = async (entry: ScheduleEntry) => {
    if (isDemo) {
      setSchedule(prev => prev.map(s => s.id === entry.id ? { ...s, is_active: !s.is_active } : s));
      return;
    }
    const { error } = await supabase.from('schedule').update({ is_active: !entry.is_active }).eq('id', entry.id);
    if (error) { alert('Gabim: ' + error.message); return; }
    setSchedule(prev => prev.map(s => s.id === entry.id ? { ...s, is_active: !s.is_active } : s));
  };

  const filteredSchedule = filterDay === 'all' ? schedule : schedule.filter(s => s.day_of_week === filterDay);
  const grouped: Record<number, ScheduleEntry[]> = {};
  filteredSchedule.forEach(s => {
    if (!grouped[s.day_of_week]) grouped[s.day_of_week] = [];
    grouped[s.day_of_week].push(s);
  });

  const selectedClass = allClasses.find(c => c.id === selectedClassId);
  const totalActive = schedule.filter(s => s.is_active).length;

  const modalSubjects = (() => {
    const cls = allClasses.find(c => c.id === form.class_id);
    if (!cls) return gradeSubjects;
    return getSubjectsForGrade(cls.grade_level).map(gs => {
      const found = allSubjects.find(s => s.name === gs.name);
      return { ...gs, id: found?.id || gs.id };
    });
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orari Mësimor</h1>
          <p className="text-slate-500 mt-1">Menaxho orarin sipas klasës</p>
        </div>
        {selectedClassId && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-700/20"
          >
            <Plus className="w-4 h-4" />
            Shto Orë
          </button>
        )}
      </div>

      {allClasses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk keni klasa të caktuara</h3>
          <p className="text-slate-500 text-sm">Drejtori duhet t'ju caktojë në klasa para se të krijoni orarin.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Zgjidh Klasën</p>
            <div className="flex flex-wrap gap-2">
              {allClasses.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedClassId(cls.id); setFilterDay('all'); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    selectedClassId === cls.id
                      ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {cls.name}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                    selectedClassId === cls.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Kl. {cls.grade_level}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedClass && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <p className="text-2xl font-bold text-slate-900">{schedule.length}</p>
                <p className="text-xs text-slate-500 mt-1">Totali orëve</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-2xl font-bold text-emerald-700">{totalActive}</p>
                <p className="text-xs text-emerald-600 mt-1">Aktive</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <p className="text-2xl font-bold text-rose-700">{schedule.length - totalActive}</p>
                <p className="text-xs text-rose-600 mt-1">Joaktive</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-2xl font-bold text-blue-700">{selectedClass.grade_level}</p>
                <p className="text-xs text-blue-600 mt-1">Niveli</p>
              </div>
            </div>
          )}

          {selectedClass && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
                Lëndët sipas kurrikulës — Klasa {selectedClass.grade_level} (Kosovë)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {gradeSubjects.map(s => (
                  <span key={s.name} className="text-xs px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-amber-800 font-medium">
                    {s.name}
                    {s.hours_per_week && <span className="ml-1 text-amber-500">{s.hours_per_week}h/j</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterDay('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filterDay === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Te Gjitha
            </button>
            {[1, 2, 3, 4, 5].map(d => (
              <button
                key={d}
                onClick={() => setFilterDay(d)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterDay === d
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {DAYS[d]}
              </button>
            ))}
          </div>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka orë të planifikuara</h3>
              <p className="text-slate-500 text-sm">Shtoni orën e parë duke klikuar "Shto Orë".</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(day => {
                const entries = grouped[day];
                if (!entries) return null;
                return (
                  <div key={day} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className={`px-6 py-3 flex items-center justify-between ${DAY_HEADER_COLORS[day]}`}>
                      <h3 className="text-sm font-bold text-white tracking-wide uppercase">{DAYS[day]}</h3>
                      <span className="text-xs text-white/80 font-medium">{entries.length} orë</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {entries
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map(entry => (
                          <div
                            key={entry.id}
                            className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                              entry.is_active ? 'hover:bg-slate-50/50' : 'bg-slate-50/70 opacity-60'
                            }`}
                          >
                            <div className={`w-2 h-12 rounded-full flex-shrink-0 ${entry.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />

                            <div className="flex items-center gap-1.5 min-w-[110px]">
                              <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                {entry.start_time} – {entry.end_time}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm truncate ${entry.is_active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                {entry.subject_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate">{entry.class_name}</p>
                            </div>

                            {entry.room && (
                              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="whitespace-nowrap">{entry.room}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleToggle(entry)}
                                title={entry.is_active ? 'Çaktivizo' : 'Aktivizo'}
                                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                  entry.is_active
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {entry.is_active
                                  ? <ToggleRight className="w-5 h-5" />
                                  : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={() => openEditModal(entry)}
                                title="Ndrysho"
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(entry)}
                                title="Fshij"
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editEntry ? 'Ndrysho Orën' : 'Shto Orë të Re'}
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
                  Klasa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.class_id}
                    onChange={e => {
                      const newClassId = e.target.value;
                      const cls = allClasses.find(c => c.id === newClassId);
                      const subs = cls ? getSubjectsForGrade(cls.grade_level) : [];
                      setForm(f => ({ ...f, class_id: newClassId, subject_id: subs[0]?.id || '' }));
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm appearance-none pr-10 transition-all"
                  >
                    <option value="">-- Zgjidh Klasën --</option>
                    {allClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} (Klasa {cls.grade_level})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Lënda <span className="text-rose-500">*</span>
                </label>
                {form.class_id ? (
                  <>
                    <div className="relative">
                      <select
                        value={form.subject_id}
                        onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm appearance-none pr-10 transition-all"
                      >
                        <option value="">-- Zgjidh Lëndën --</option>
                        {modalSubjects.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.hours_per_week ? ` — ${s.hours_per_week}h/javë` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Lëndët sipas kurrikulës kosovare për klasën e zgjedhur
                    </p>
                  </>
                ) : (
                  <div className="px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-400">
                    Zgjidh klasën fillimisht
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Dita e Javës <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.day_of_week}
                    onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm appearance-none pr-10 transition-all"
                  >
                    {[1, 2, 3, 4, 5].map(d => (
                      <option key={d} value={d}>{DAYS[d]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Fillon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mbaron <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Salla / Dhoma
                </label>
                <input
                  type="text"
                  value={form.room}
                  onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                  placeholder="p.sh. Salla 12, Lab. Kimisë..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm transition-all"
                />
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
                {saving ? 'Duke ruajtur...' : editEntry ? 'Ruaj Ndryshimet' : 'Shto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
