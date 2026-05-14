import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BookOpen, Users, TrendingUp, Clock, Loader2, AlertCircle } from 'lucide-react';

interface ClassData {
  id: string;
  className: string;
  subjectName: string;
  studentCount: number;
  avgGrade: number;
  scheduleCount: number;
  recentGrades: number[];
  nextLesson: string;
  room: string;
}

export default function MyClasses() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    loadClasses();
  }, [profile]);

  const loadClasses = async () => {
    if (isDemo) {
      setClasses([
        { id: '1', className: 'Klasa 5-A', subjectName: 'Matematike', studentCount: 28, avgGrade: 4.1, scheduleCount: 3, recentGrades: [5, 4, 5, 3, 4, 5, 3, 4, 5, 5], nextLesson: 'E Hene 08:00', room: 'Salla 12' },
        { id: '2', className: 'Klasa 7-A', subjectName: 'Matematike', studentCount: 30, avgGrade: 3.9, scheduleCount: 3, recentGrades: [3, 4, 3, 5, 4, 4, 2, 4, 4, 3], nextLesson: 'E Hene 08:50', room: 'Salla 12' },
        { id: '3', className: 'Klasa 8-A', subjectName: 'Fizike', studentCount: 27, avgGrade: 3.8, scheduleCount: 2, recentGrades: [4, 4, 3, 3, 4, 5, 2, 4, 4, 3], nextLesson: 'E Hene 09:50', room: 'Lab. Fizikes' },
        { id: '4', className: 'Klasa 9-A', subjectName: 'Matematike', studentCount: 26, avgGrade: 4.0, scheduleCount: 3, recentGrades: [4, 5, 3, 4, 3, 5, 4, 4, 4, 5], nextLesson: 'E Hene 10:40', room: 'Salla 15' },
        { id: '5', className: 'Klasa 7-B', subjectName: 'Fizike', studentCount: 29, avgGrade: 3.6, scheduleCount: 2, recentGrades: [3, 4, 2, 4, 3, 3, 4, 2, 4, 3], nextLesson: 'E Hene 11:40', room: 'Lab. Fizikes' },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: classSubjects } = await supabase
        .from('class_subjects')
        .select('id, class_id, subject_id, classes(name), subjects(name)')
        .eq('teacher_id', profile?.id);

      if (!classSubjects || classSubjects.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const classIds = [...new Set(classSubjects.map(cs => cs.class_id))];

      const [enrollRes, gradesRes, schedRes] = await Promise.all([
        supabase.from('student_classes').select('class_id').in('class_id', classIds),
        supabase.from('grades').select('grade, class_id, subject_id, created_at').eq('teacher_id', profile?.id).order('created_at', { ascending: false }),
        supabase.from('schedule').select('class_id, subject_id, day_of_week, start_time, end_time, room').eq('teacher_id', profile?.id).order('day_of_week').order('start_time'),
      ]);

      const enrollMap: Record<string, number> = {};
      enrollRes.data?.forEach(e => { enrollMap[e.class_id] = (enrollMap[e.class_id] || 0) + 1; });

      const DAY_NAMES: Record<number, string> = { 1: 'E Hene', 2: 'E Marte', 3: 'E Merkure', 4: 'E Enjte', 5: 'E Premte' };

      const result: ClassData[] = classSubjects.map((cs: any) => {
        const csGrades = gradesRes.data?.filter(g => g.class_id === cs.class_id && g.subject_id === cs.subject_id) || [];
        const avgGrade = csGrades.length > 0
          ? Number((csGrades.reduce((s, g) => s + g.grade, 0) / csGrades.length).toFixed(1))
          : 0;

        const recentTen = csGrades.slice(0, 10).map(g => g.grade);

        const csSchedule = schedRes.data?.filter(s => s.class_id === cs.class_id && s.subject_id === cs.subject_id) || [];

        let nextLesson = '';
        let room = '';
        if (csSchedule.length > 0) {
          const first = csSchedule[0];
          nextLesson = `${DAY_NAMES[first.day_of_week] || ''} ${first.start_time.substring(0, 5)}`;
          room = first.room || '';
        }

        return {
          id: cs.id,
          className: cs.classes?.name || '',
          subjectName: cs.subjects?.name || '',
          studentCount: enrollMap[cs.class_id] || 0,
          avgGrade,
          scheduleCount: csSchedule.length,
          recentGrades: recentTen,
          nextLesson,
          room,
        };
      });

      setClasses(result);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Klasat e Mia</h1>
          <p className="text-slate-500 mt-1">Menaxhoni klasat dhe lendet tuaja</p>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk jeni caktuar ne asnje klase</h3>
          <p className="text-slate-500 text-sm">Drejtori duhet t'ju caktoje ne klasa dhe lende.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Klasat e Mia</h1>
        <p className="text-slate-500 mt-1">Menaxhoni klasat dhe lendet tuaja</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:border-teal-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{cls.className}</h3>
                  <p className="text-sm text-slate-500">{cls.subjectName}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Users className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900">{cls.studentCount}</p>
                <p className="text-xs text-slate-500">Nxenes</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className={`text-lg font-bold ${
                  cls.avgGrade >= 4 ? 'text-emerald-600' :
                  cls.avgGrade >= 3 ? 'text-blue-600' :
                  cls.avgGrade > 0 ? 'text-amber-600' :
                  'text-slate-400'
                }`}>
                  {cls.avgGrade > 0 ? cls.avgGrade : '-'}
                </p>
                <p className="text-xs text-slate-500">Mesatare</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-slate-900">{cls.scheduleCount}</p>
                <p className="text-xs text-slate-500">Ore/jave</p>
              </div>
            </div>

            {cls.recentGrades.length > 0 && (
              <>
                <div className="flex items-center gap-1 mb-3">
                  {cls.recentGrades.map((g, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded ${
                        g >= 5 ? 'bg-emerald-400' :
                        g >= 4 ? 'bg-teal-300' :
                        g >= 3 ? 'bg-cyan-300' :
                        g >= 2 ? 'bg-amber-300' :
                        'bg-rose-300'
                      }`}
                      style={{ opacity: 0.5 + (i / Math.max(cls.recentGrades.length, 1)) * 0.5 }}
                      title={`Nota: ${g}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mb-3">{cls.recentGrades.length} notat e fundit</p>
              </>
            )}

            {cls.nextLesson && (
              <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  Ora e ardhshme: {cls.nextLesson}
                </div>
                <span className="text-xs text-slate-400">{cls.room}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
