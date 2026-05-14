import { useState, useEffect } from 'react';
import { Save, Check, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Grade } from '../../types/database';
import { getGradeBgColor } from '../../types/database';

interface StudentGradeData {
  student_id: string;
  student_name: string;
  v1: string;
  v2: string;
  v3: string;
  v4: string;
  perfundimtare: string;
}

interface ExistingGrade {
  [key: number]: string;
  perfundimtare?: string;
}

interface TeacherClass {
  id: string;
  class_id: string;
  subject_id: string;
  name: string;
  subject: { id: string; name: string };
  classData: { id: string; name: string; grade_level: number; section: string };
}

const DEMO_CLASSES: TeacherClass[] = [
  {
    id: 'demo-cs-1',
    class_id: 'demo-class-7a',
    subject_id: 'demo-subj-mat',
    name: 'Klasa 7-A - Matematike',
    subject: { id: 'demo-subj-mat', name: 'Matematike' },
    classData: { id: 'demo-class-7a', name: 'Klasa 7-A', grade_level: 7, section: 'A' },
  },
  {
    id: 'demo-cs-2',
    class_id: 'demo-class-8b',
    subject_id: 'demo-subj-mat',
    name: 'Klasa 8-B - Matematike',
    subject: { id: 'demo-subj-mat', name: 'Matematike' },
    classData: { id: 'demo-class-8b', name: 'Klasa 8-B', grade_level: 8, section: 'B' },
  },
];

const DEMO_STUDENTS: Record<string, StudentGradeData[]> = {
  'demo-cs-1': [
    { student_id: 's1', student_name: 'Ardi Krasniqi', v1: '4', v2: '5', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's2', student_name: 'Blerta Hoxha', v1: '5', v2: '5', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's3', student_name: 'Dren Berisha', v1: '3', v2: '4', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's4', student_name: 'Ema Gashi', v1: '4', v2: '3', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's5', student_name: 'Faton Morina', v1: '5', v2: '4', v3: '', v4: '', perfundimtare: '' },
  ],
  'demo-cs-2': [
    { student_id: 's6', student_name: 'Genta Rexhepi', v1: '4', v2: '', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's7', student_name: 'Haris Maloku', v1: '3', v2: '', v3: '', v4: '', perfundimtare: '' },
    { student_id: 's8', student_name: 'Iliriana Shala', v1: '5', v2: '', v3: '', v4: '', perfundimtare: '' },
  ],
};

export default function GradeEntry() {
  const { profile, isDemo } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>('');
  const [semester, setSemester] = useState<number>(1);
  const [students, setStudents] = useState<StudentGradeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadTeacherClasses();
  }, [profile]);

  useEffect(() => {
    if (selectedClassSubject) {
      loadStudentGrades();
    }
  }, [selectedClassSubject, semester]);

  const loadTeacherClasses = async () => {
    if (!profile) return;

    if (isDemo) {
      setClasses(DEMO_CLASSES);
      setSelectedClassSubject(DEMO_CLASSES[0].id);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: classSubjects, error: csError } = await supabase
        .from('class_subjects')
        .select(`
          id,
          class_id,
          subject_id,
          classes:class_id (
            id,
            name,
            grade_level,
            section
          ),
          subjects:subject_id (
            id,
            name
          )
        `)
        .eq('teacher_id', profile.id);

      if (csError) throw csError;

      const mapped: TeacherClass[] = classSubjects?.map((cs: any) => ({
        id: cs.id,
        class_id: cs.class_id,
        subject_id: cs.subject_id,
        name: `${cs.classes.name} - ${cs.subjects.name}`,
        subject: cs.subjects,
        classData: cs.classes,
      })) || [];

      setClasses(mapped);
      if (mapped.length > 0) {
        setSelectedClassSubject(mapped[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentGrades = async () => {
    if (!selectedClassSubject || !profile) return;

    if (isDemo) {
      setStudents(DEMO_STUDENTS[selectedClassSubject]?.map(s => ({ ...s })) || []);
      return;
    }

    try {
      setLoading(true);
      const selected = classes.find(c => c.id === selectedClassSubject);
      if (!selected) return;

      const [enrollRes, gradesRes] = await Promise.all([
        supabase
          .from('student_classes')
          .select('student_id, profiles:student_id(id, full_name)')
          .eq('class_id', selected.classData.id),
        supabase
          .from('grades')
          .select('*')
          .eq('class_id', selected.classData.id)
          .eq('subject_id', selected.subject.id)
          .eq('semester', semester),
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (gradesRes.error) throw gradesRes.error;

      const studentData: StudentGradeData[] = enrollRes.data
        ?.filter((enrollment: any) => enrollment.profiles != null)
        .map((enrollment: any) => {
        const studentGrades = gradesRes.data?.filter(
          (g: Grade) => g.student_id === enrollment.student_id
        ) || [];

        const gradeMap: ExistingGrade = {};
        studentGrades.forEach((g: Grade) => {
          if (g.assessment_type === 'vlersim' && g.assessment_number) {
            gradeMap[g.assessment_number] = g.grade.toString();
          } else if (g.assessment_type === 'perfundimtare_gjysmvjetor') {
            gradeMap.perfundimtare = g.grade.toString();
          }
        });

        return {
          student_id: enrollment.student_id,
          student_name: enrollment.profiles?.full_name || '',
          v1: gradeMap[1] || '',
          v2: gradeMap[2] || '',
          v3: gradeMap[3] || '',
          v4: gradeMap[4] || '',
          perfundimtare: gradeMap.perfundimtare || '',
        };
      }) || [];

      setStudents(studentData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (index: number, field: keyof StudentGradeData, value: string) => {
    const num = Number(value);
    if (value === '' || (num >= 1 && num <= 5)) {
      const updated = [...students];
      updated[index] = { ...updated[index], [field]: value };
      setStudents(updated);
      setSaved(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !selectedClassSubject) return;

    if (isDemo) {
      setSaving(true);
      setTimeout(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }, 800);
      return;
    }

    const selected = classes.find(c => c.id === selectedClassSubject);
    if (!selected) return;

    try {
      setSaving(true);
      setError('');

      for (const student of students) {
        const assessments = [
          { num: 1, value: student.v1 },
          { num: 2, value: student.v2 },
          { num: 3, value: student.v3 },
          { num: 4, value: student.v4 },
        ];

        for (const assessment of assessments) {
          if (!assessment.value) continue;

          const { data: existing, error: checkError } = await supabase
            .from('grades')
            .select('id')
            .eq('student_id', student.student_id)
            .eq('class_id', selected.classData.id)
            .eq('subject_id', selected.subject.id)
            .eq('semester', semester)
            .eq('assessment_type', 'vlersim')
            .eq('assessment_number', assessment.num)
            .maybeSingle();

          if (checkError) throw checkError;

          if (existing) {
            const { error: updateError } = await supabase
              .from('grades')
              .update({ grade: Number(assessment.value), date: new Date().toISOString().split('T')[0] })
              .eq('id', existing.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('grades')
              .insert({
                student_id: student.student_id,
                class_id: selected.classData.id,
                subject_id: selected.subject.id,
                teacher_id: profile.id,
                grade: Number(assessment.value),
                semester,
                assessment_type: 'vlersim',
                assessment_number: assessment.num,
                date: new Date().toISOString().split('T')[0],
              });
            if (insertError) throw insertError;
          }
        }

        if (student.perfundimtare) {
          const { data: existing, error: checkError } = await supabase
            .from('grades')
            .select('id')
            .eq('student_id', student.student_id)
            .eq('class_id', selected.classData.id)
            .eq('subject_id', selected.subject.id)
            .eq('semester', semester)
            .eq('assessment_type', 'perfundimtare_gjysmvjetor')
            .maybeSingle();

          if (checkError) throw checkError;

          if (existing) {
            const { error: updateError } = await supabase
              .from('grades')
              .update({ grade: Number(student.perfundimtare), date: new Date().toISOString().split('T')[0] })
              .eq('id', existing.id);
            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase
              .from('grades')
              .insert({
                student_id: student.student_id,
                class_id: selected.classData.id,
                subject_id: selected.subject.id,
                teacher_id: profile.id,
                grade: Number(student.perfundimtare),
                semester,
                assessment_type: 'perfundimtare_gjysmvjetor',
                assessment_number: null,
                date: new Date().toISOString().split('T')[0],
              });
            if (insertError) throw insertError;
          }
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const num = Number(grade);
    if (!grade || isNaN(num)) return '';
    if (num >= 5) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300';
    if (num >= 4) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-300';
    if (num >= 3) return 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-300';
    if (num >= 2) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-300';
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-300';
  };

  if (loading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (classes.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendosni Nota</h1>
          <p className="text-slate-500 mt-1">Sistemi i vleresimit te Kosoves (1-5)</p>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk jeni caktuar ne asnje klase</h3>
          <p className="text-sm text-slate-500">Kontaktoni drejtorine per t'u caktuar ne klase dhe lende.</p>
        </div>
      </div>
    );
  }

  const hasChanges = students.some(s => s.v1 || s.v2 || s.v3 || s.v4 || s.perfundimtare);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendosni Nota</h1>
          <p className="text-slate-500 mt-1">Sistemi i vleresimit te Kosoves - 4 vlersime + perfundimtare (1-5)</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
            saved
              ? 'bg-emerald-600 text-white shadow-emerald-600/25'
              : 'bg-teal-700 text-white hover:bg-teal-600 shadow-teal-700/25 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Duke ruajtur...
            </>
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              U Ruajt
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Ruaj Notat
            </>
          )}
        </button>
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Klasa dhe Lenda</label>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={selectedClassSubject}
                onChange={(e) => setSelectedClassSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Gjysmevjetori</label>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm"
            >
              <option value={1}>Gjysmevjetori i Pare</option>
              <option value={2}>Gjysmevjetori i Dyte</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">Nxenesi</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V1</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V2</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V3</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">V4</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider bg-teal-50">Perfundimtare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, i) => (
                <tr key={student.student_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-3 text-sm text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-xl flex items-center justify-center text-white text-sm font-bold">
                        {student.student_name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{student.student_name}</span>
                    </div>
                  </td>
                  {(['v1', 'v2', 'v3', 'v4'] as const).map((field) => (
                    <td key={field} className="px-3 py-3">
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={student[field]}
                        onChange={(e) => handleGradeChange(i, field, e.target.value)}
                        placeholder="1-5"
                        className={`w-16 px-2 py-2 border rounded-lg text-center text-sm font-semibold outline-none transition-all ${
                          student[field] ? getGradeColor(student[field]) : 'border-slate-200 focus:ring-2 focus:ring-teal-500'
                        }`}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 bg-teal-50/50">
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={student.perfundimtare}
                      onChange={(e) => handleGradeChange(i, 'perfundimtare', e.target.value)}
                      placeholder="1-5"
                      className={`w-16 px-2 py-2 border rounded-lg text-center text-sm font-bold outline-none transition-all ${
                        student.perfundimtare ? getGradeColor(student.perfundimtare) : 'border-teal-200 bg-white focus:ring-2 focus:ring-teal-500'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nuk ka nxenes te regjistruar ne kete klase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
