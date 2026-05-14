import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Grade } from '../../types/database';

interface SubjectGrades {
  subject_id: string;
  subject_name: string;
  v1: number | null;
  v2: number | null;
  v3: number | null;
  v4: number | null;
  perfundimtare: number | null;
  average: number | null;
}

const DEMO_GRADES: SubjectGrades[] = [
  { subject_id: 'd1', subject_name: 'Matematike', v1: 4, v2: 5, v3: 4, v4: null, perfundimtare: null, average: 4.33 },
  { subject_id: 'd2', subject_name: 'Gjuhe Shqipe', v1: 5, v2: 4, v3: 5, v4: null, perfundimtare: null, average: 4.67 },
  { subject_id: 'd3', subject_name: 'Anglisht', v1: 5, v2: 5, v3: null, v4: null, perfundimtare: null, average: 5.0 },
  { subject_id: 'd4', subject_name: 'Fizike', v1: 3, v2: 4, v3: 3, v4: null, perfundimtare: null, average: 3.33 },
  { subject_id: 'd5', subject_name: 'Biologji', v1: 4, v2: 4, v3: null, v4: null, perfundimtare: null, average: 4.0 },
  { subject_id: 'd6', subject_name: 'Histori', v1: 5, v2: 5, v3: 4, v4: null, perfundimtare: null, average: 4.67 },
];

export default function MyGrades() {
  const { profile, isDemo } = useAuth();
  const [semester, setSemester] = useState<number>(1);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [overallAverage, setOverallAverage] = useState<number>(0);

  useEffect(() => {
    loadGrades();
  }, [profile, semester]);

  const loadGrades = async () => {
    if (!profile) return;

    if (isDemo) {
      setSubjectGrades(DEMO_GRADES);
      const avgs = DEMO_GRADES.map(s => s.average).filter(a => a !== null) as number[];
      setOverallAverage(avgs.length > 0 ? Number((avgs.reduce((s, v) => s + v, 0) / avgs.length).toFixed(2)) : 0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: enrollment, error: enrollError } = await supabase
        .from('student_classes')
        .select('class_id')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (enrollError) throw enrollError;
      if (!enrollment) {
        setError('Nuk jeni i regjistruar ne asnje klase.');
        setSubjectGrades([]);
        setLoading(false);
        return;
      }

      const [csRes, gradesRes] = await Promise.all([
        supabase
          .from('class_subjects')
          .select('subject_id, subjects:subject_id(id, name)')
          .eq('class_id', enrollment.class_id),
        supabase
          .from('grades')
          .select('*')
          .eq('student_id', profile.id)
          .eq('class_id', enrollment.class_id)
          .eq('semester', semester),
      ]);

      if (csRes.error) throw csRes.error;
      if (gradesRes.error) throw gradesRes.error;

      const subjectData: SubjectGrades[] = csRes.data?.map((cs: any) => {
        const sGrades = gradesRes.data?.filter((g: Grade) => g.subject_id === cs.subject_id) || [];

        const gradeMap: Record<string, number> = {};
        sGrades.forEach((g: Grade) => {
          if (g.assessment_type === 'vlersim' && g.assessment_number) {
            gradeMap[`v${g.assessment_number}`] = g.grade;
          } else if (g.assessment_type === 'perfundimtare_gjysmvjetor') {
            gradeMap.perfundimtare = g.grade;
          }
        });

        const assessments = [gradeMap.v1, gradeMap.v2, gradeMap.v3, gradeMap.v4].filter(v => v !== undefined);
        const average = assessments.length > 0
          ? assessments.reduce((sum, v) => sum + v, 0) / assessments.length
          : null;

        return {
          subject_id: cs.subject_id,
          subject_name: cs.subjects.name,
          v1: gradeMap.v1 ?? null,
          v2: gradeMap.v2 ?? null,
          v3: gradeMap.v3 ?? null,
          v4: gradeMap.v4 ?? null,
          perfundimtare: gradeMap.perfundimtare ?? null,
          average,
        };
      }) || [];

      const validAverages = subjectData
        .map(s => s.perfundimtare || s.average)
        .filter(avg => avg !== null) as number[];

      const overall = validAverages.length > 0
        ? validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length
        : 0;

      setSubjectGrades(subjectData);
      setOverallAverage(Number(overall.toFixed(2)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'bg-slate-100 text-slate-400';
    if (grade >= 5) return 'bg-emerald-100 text-emerald-700';
    if (grade >= 4) return 'bg-blue-100 text-blue-700';
    if (grade >= 3) return 'bg-cyan-100 text-cyan-700';
    if (grade >= 2) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return '-';
    if (grade >= 4.5) return 'Shkelqyeshem';
    if (grade >= 3.5) return 'Shume Mire';
    if (grade >= 2.5) return 'Mire';
    if (grade >= 1.5) return 'Mjaftueshem';
    return 'Pamjaftueshem';
  };

  const getAverageColor = (avg: number) => {
    if (avg >= 4.5) return 'text-emerald-600';
    if (avg >= 3.5) return 'text-blue-600';
    if (avg >= 2.5) return 'text-cyan-600';
    if (avg >= 1.5) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notat e Mia</h1>
          <p className="text-slate-500 mt-1">Shikoni te gjitha vleresimet tuaja</p>
        </div>
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-cyan-500" />
          <div>
            <p className="text-xs text-slate-500">Mesatarja Pergjithshme</p>
            <p className={`text-2xl font-bold ${overallAverage > 0 ? getAverageColor(overallAverage) : 'text-slate-400'}`}>
              {overallAverage > 0 ? overallAverage.toFixed(2) : '-'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-rose-900">Gabim</p>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Gjysmevjetori</label>
          <select
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none text-sm"
          >
            <option value={1}>Gjysmevjetori i Pare</option>
            <option value={2}>Gjysmevjetori i Dyte</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
                  Lenda
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V1</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V2</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V3</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V4</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-cyan-600 uppercase tracking-wider bg-cyan-50">
                  Perfundimtare
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Mesatarja
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectGrades.map((subject) => (
                <tr key={subject.subject_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900">{subject.subject_name}</span>
                    </div>
                  </td>
                  {([subject.v1, subject.v2, subject.v3, subject.v4] as (number | null)[]).map((grade, idx) => (
                    <td key={idx} className="px-3 py-4">
                      <div className={`w-12 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold ${getGradeColor(grade)}`}>
                        {grade ?? '-'}
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-4 bg-cyan-50/50">
                    <div className={`w-12 h-10 mx-auto rounded-lg flex items-center justify-center text-sm font-bold ring-2 ${
                      subject.perfundimtare !== null
                        ? getGradeColor(subject.perfundimtare) + ' ring-cyan-300'
                        : 'bg-slate-100 text-slate-400 ring-slate-200'
                    }`}>
                      {subject.perfundimtare ?? '-'}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="text-center">
                      <p className={`text-sm font-bold ${
                        subject.average !== null ? getAverageColor(subject.average) : 'text-slate-400'
                      }`}>
                        {subject.average !== null ? subject.average.toFixed(2) : '-'}
                      </p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjectGrades.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nuk ka nota te disponueshme per kete gjysmevjetor.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className="font-semibold text-slate-900">Permbledhje sipas Lendes</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectGrades
            .filter(s => s.perfundimtare !== null || s.average !== null)
            .sort((a, b) => {
              const avgA = a.perfundimtare || a.average || 0;
              const avgB = b.perfundimtare || b.average || 0;
              return avgB - avgA;
            })
            .map((subject) => {
              const displayGrade = subject.perfundimtare || subject.average || 0;
              return (
                <div key={subject.subject_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold ${getGradeColor(displayGrade)}`}>
                    {displayGrade.toFixed(1)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{subject.subject_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{getGradeLabel(displayGrade)}</p>
                  </div>
                </div>
              );
            })}
        </div>
        {subjectGrades.filter(s => s.perfundimtare !== null || s.average !== null).length === 0 && (
          <p className="text-center text-slate-500 py-8">Nuk ka nota te disponueshme.</p>
        )}
      </div>
    </div>
  );
}
