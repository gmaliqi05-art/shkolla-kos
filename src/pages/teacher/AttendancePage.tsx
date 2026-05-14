import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Check, X, Clock, AlertCircle, Save, Loader2 } from 'lucide-react';

type AttendanceStatus = 'prezent' | 'mungon' | 'vonese' | 'arsyeshme';

interface Student {
  id: string;
  full_name: string;
  status: AttendanceStatus;
}

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  classes: { name: string };
  subjects: { name: string };
}

export default function AttendancePage() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    loadClassSubjects();
  }, [profile]);

  useEffect(() => {
    if (selectedClassSubject) {
      loadStudents();
    }
  }, [selectedClassSubject, date]);

  const loadClassSubjects = async () => {
    if (isDemo) {
      setClassSubjects([
        {
          id: 'demo-1',
          class_id: 'demo-class',
          subject_id: 'demo-subject',
          classes: { name: 'Klasa 5-A' },
          subjects: { name: 'Matematikë' },
        },
      ]);
      setSelectedClassSubject('demo-1');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('class_subjects')
        .select(`
          id,
          class_id,
          subject_id,
          classes (name),
          subjects (name)
        `)
        .eq('teacher_id', profile?.id);

      if (error) throw error;

      setClassSubjects(data || []);
      if (data && data.length > 0) {
        setSelectedClassSubject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (isDemo) {
      setStudents([
        { id: 'demo-1', full_name: 'Ardi Malaj', status: 'prezent' },
        { id: 'demo-2', full_name: 'Besa Koci', status: 'prezent' },
        { id: 'demo-3', full_name: 'Dion Gashi', status: 'mungon' },
        { id: 'demo-4', full_name: 'Elona Prifti', status: 'prezent' },
        { id: 'demo-5', full_name: 'Fiona Dema', status: 'prezent' },
        { id: 'demo-6', full_name: 'Genti Hasa', status: 'vonese' },
        { id: 'demo-7', full_name: 'Hana Topi', status: 'prezent' },
        { id: 'demo-8', full_name: 'Ina Berisha', status: 'prezent' },
        { id: 'demo-9', full_name: 'Kledi Muca', status: 'arsyeshme' },
        { id: 'demo-10', full_name: 'Lea Xhafa', status: 'prezent' },
        { id: 'demo-11', full_name: 'Marin Dushi', status: 'prezent' },
        { id: 'demo-12', full_name: 'Nora Cela', status: 'prezent' },
      ]);
      return;
    }

    try {
      const currentClassSubject = classSubjects.find(cs => cs.id === selectedClassSubject);
      if (!currentClassSubject) return;

      const { data: enrollments, error: enrollError } = await supabase
        .from('student_classes')
        .select(`
          student_id,
          profiles (id, full_name)
        `)
        .eq('class_id', currentClassSubject.class_id);

      if (enrollError) throw enrollError;

      const { data: existingAttendance, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', currentClassSubject.class_id)
        .eq('date', date);

      if (attError) throw attError;

      const attendanceMap = new Map(
        existingAttendance?.map(a => [a.student_id, a.status]) || []
      );

      const studentsData = enrollments
        ?.filter(e => e.profiles != null)
        .map(e => ({
          id: (e.profiles as any).id,
          full_name: (e.profiles as any).full_name,
          status: attendanceMap.get((e.profiles as any).id) || 'prezent',
        })) || [];

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, status } : s))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (isDemo) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return;
    }

    setSaving(true);

    try {
      const currentClassSubject = classSubjects.find(cs => cs.id === selectedClassSubject);
      if (!currentClassSubject) return;

      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        class_id: currentClassSubject.class_id,
        date,
        status: student.status,
        recorded_by: profile?.id,
      }));

      const { error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,class_id,date',
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Gabim gjatë ruajtjes: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const statusCounts = {
    prezent: students.filter(s => s.status === 'prezent').length,
    mungon: students.filter(s => s.status === 'mungon').length,
    vonese: students.filter(s => s.status === 'vonese').length,
    arsyeshme: students.filter(s => s.status === 'arsyeshme').length,
  };

  const statusConfig: Record<AttendanceStatus, { icon: typeof Check; color: string; bg: string }> = {
    prezent: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' },
    mungon: { icon: X, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100' },
    vonese: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
    arsyeshme: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!isDemo && classSubjects.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka klasa</h3>
        <p className="text-slate-500">Drejtori duhet t'ju caktoje në klasa dhe lëndë.</p>
      </div>
    );
  }

  const currentClassSubject = classSubjects.find(cs => cs.id === selectedClassSubject);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Frekuentimi</h1>
          <p className="text-slate-500 mt-1">Regjistro prezencen e nxenesve</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg disabled:opacity-50 ${
            saved
              ? 'bg-emerald-600 text-white shadow-emerald-600/25'
              : 'bg-teal-700 text-white hover:bg-teal-600 shadow-teal-700/25'
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Duke ruajtur...' : saved ? 'U Ruajt' : 'Ruaj'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{statusCounts.prezent}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">Prezent</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-rose-700">{statusCounts.mungon}</p>
          <p className="text-xs text-rose-600 font-medium mt-1">Mungon</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{statusCounts.vonese}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">Vonese</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{statusCounts.arsyeshme}</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Arsyeshme</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Klasa dhe Lënda</label>
            <select
              value={selectedClassSubject}
              onChange={(e) => setSelectedClassSubject(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
            >
              {classSubjects.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.classes.name} - {cs.subjects.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Legjenda:</span>
          {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              <span className="text-xs text-slate-600 capitalize">{key}</span>
            </div>
          ))}
        </div>

        {students.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Nuk ka nxënës të regjistruar në {currentClassSubject?.classes.name}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {students.map((student, i) => (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  student.status === 'mungon' ? 'bg-rose-50/50' :
                  student.status === 'vonese' ? 'bg-amber-50/50' :
                  student.status === 'arsyeshme' ? 'bg-blue-50/50' :
                  'hover:bg-slate-50'
                }`}
              >
                <span className="text-sm text-slate-400 w-6">{i + 1}</span>
                <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {student.full_name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-900 flex-1">{student.full_name}</span>
                <div className="flex items-center gap-1.5">
                  {(Object.entries(statusConfig) as [AttendanceStatus, typeof statusConfig[AttendanceStatus]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(student.id, key)}
                      className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all ${
                        student.status === key
                          ? cfg.bg + ' ' + cfg.color
                          : 'border-slate-200 text-slate-300 hover:border-slate-300'
                      }`}
                      title={key}
                    >
                      <cfg.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
