import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  ClipboardCheck,
  ChevronRight,
} from 'lucide-react';

interface SubjectAvg { name: string; avg: number; }
interface ClassPerf { className: string; gradeLevel: number; section: string; avg: number; studentCount: number; }
interface TeacherActivity { id: string; name: string; classCount: number; gradesThisMonth: number; lastGradeDate: string | null; attendanceThisMonth: number; }
interface AtRiskStudent { id: string; name: string; className: string; avg: number; absences: number; }

interface Stats {
  schoolAvg: number;
  attendancePct: number;
  totalDays: number;
  totalAbsences: number;
  justifiedAbsences: number;
  studentsWithFive: number;
  studentsWithOne: number;
  totalGrades: number;
}

const DEMO_SUBJECT_AVGS: SubjectAvg[] = [
  { name: 'Matematike', avg: 3.9 }, { name: 'Gjuhe Shqipe', avg: 4.1 },
  { name: 'Histori', avg: 3.7 }, { name: 'Gjeografi', avg: 3.8 },
  { name: 'Biologji', avg: 4.0 }, { name: 'Fizike', avg: 3.6 },
  { name: 'Kimi', avg: 3.5 }, { name: 'Anglisht', avg: 4.2 },
  { name: 'Edukim Fizik', avg: 4.6 }, { name: 'Art Pamor', avg: 4.4 },
];

const DEMO_CLASS_PERF: ClassPerf[] = [
  { className: '6A', gradeLevel: 6, section: 'A', avg: 3.9, studentCount: 28 },
  { className: '6B', gradeLevel: 6, section: 'B', avg: 3.7, studentCount: 27 },
  { className: '7A', gradeLevel: 7, section: 'A', avg: 3.8, studentCount: 30 },
  { className: '7B', gradeLevel: 7, section: 'B', avg: 3.6, studentCount: 29 },
  { className: '8A', gradeLevel: 8, section: 'A', avg: 4.0, studentCount: 26 },
  { className: '8B', gradeLevel: 8, section: 'B', avg: 3.9, studentCount: 27 },
  { className: '9A', gradeLevel: 9, section: 'A', avg: 3.7, studentCount: 25 },
  { className: '9B', gradeLevel: 9, section: 'B', avg: 3.5, studentCount: 24 },
];

const DEMO_STATS: Stats = {
  schoolAvg: 3.95, attendancePct: 91.2, totalDays: 1850, totalAbsences: 164,
  justifiedAbsences: 98, studentsWithFive: 45, studentsWithOne: 8, totalGrades: 1240,
};

const DEMO_TEACHER_ACTIVITY: TeacherActivity[] = [
  { id: '1', name: 'Florentina Gashi', classCount: 4, gradesThisMonth: 48, lastGradeDate: new Date().toISOString().split('T')[0], attendanceThisMonth: 112 },
  { id: '2', name: 'Arben Krasniqi', classCount: 5, gradesThisMonth: 35, lastGradeDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], attendanceThisMonth: 98 },
  { id: '3', name: 'Vjosa Berisha', classCount: 3, gradesThisMonth: 12, lastGradeDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], attendanceThisMonth: 45 },
  { id: '4', name: 'Mentor Hoxha', classCount: 4, gradesThisMonth: 0, lastGradeDate: null, attendanceThisMonth: 0 },
  { id: '5', name: 'Dita Osmani', classCount: 3, gradesThisMonth: 28, lastGradeDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], attendanceThisMonth: 78 },
];

const DEMO_AT_RISK: AtRiskStudent[] = [
  { id: '1', name: 'Besian Kelmendi', className: '8A', avg: 1.8, absences: 14 },
  { id: '2', name: 'Lirije Stublla', className: '7B', avg: 2.1, absences: 9 },
  { id: '3', name: 'Ardit Tahiri', className: '9A', avg: 2.2, absences: 11 },
  { id: '4', name: 'Vesa Halili', className: '6B', avg: 1.5, absences: 18 },
];

type ActiveTab = 'overview' | 'teachers' | 'atrisk' | 'attendance';

export default function Reports() {
  const { isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<Stats>(DEMO_STATS);
  const [subjectAvgs, setSubjectAvgs] = useState<SubjectAvg[]>([]);
  const [classPerf, setClassPerf] = useState<ClassPerf[]>([]);
  const [teacherActivity, setTeacherActivity] = useState<TeacherActivity[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    if (isDemo) {
      await new Promise(r => setTimeout(r, 300));
      setStats(DEMO_STATS);
      setSubjectAvgs(DEMO_SUBJECT_AVGS);
      setClassPerf(DEMO_CLASS_PERF);
      setTeacherActivity(DEMO_TEACHER_ACTIVITY);
      setAtRiskStudents(DEMO_AT_RISK);
      setLastUpdated(new Date());
      setLoading(false);
      return;
    }

    try {
      const [gradesRes, attendanceRes, subjectsRes, classesRes] = await Promise.all([
        supabase.from('grades').select('grade, subject_id, class_id, student_id, teacher_id, date, created_at'),
        supabase.from('attendance').select('status, student_id, date'),
        supabase.from('subjects').select('id, name'),
        supabase.from('classes').select('id, name, grade_level, section'),
      ]);

      const grades = gradesRes.data || [];
      const attendance = attendanceRes.data || [];
      const subjects = subjectsRes.data || [];
      const classes = classesRes.data || [];

      const schoolAvg = grades.length > 0
        ? parseFloat((grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(2)) : 0;

      const total = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'prezent' || a.status === 'vonese').length;
      const absentCount = attendance.filter(a => a.status === 'mungon').length;
      const justifiedCount = attendance.filter(a => a.status === 'arsyeshme').length;
      const attendancePct = total > 0 ? parseFloat(((presentCount / total) * 100).toFixed(1)) : 0;
      const studentsWithFive = new Set(grades.filter(g => g.grade === 5).map(g => g.student_id)).size;
      const studentsWithOne = new Set(grades.filter(g => g.grade === 1).map(g => g.student_id)).size;

      setStats({ schoolAvg, attendancePct, totalDays: total, totalAbsences: absentCount + justifiedCount, justifiedAbsences: justifiedCount, studentsWithFive, studentsWithOne, totalGrades: grades.length });

      const subjectMap: Record<string, { name: string; sum: number; count: number }> = {};
      subjects.forEach(s => { subjectMap[s.id] = { name: s.name, sum: 0, count: 0 }; });
      grades.forEach(g => {
        if (g.subject_id && subjectMap[g.subject_id]) {
          subjectMap[g.subject_id].sum += g.grade;
          subjectMap[g.subject_id].count += 1;
        }
      });
      const computed: SubjectAvg[] = Object.values(subjectMap)
        .filter(s => s.count > 0)
        .map(s => ({ name: s.name, avg: parseFloat((s.sum / s.count).toFixed(2)) }))
        .sort((a, b) => b.avg - a.avg);
      setSubjectAvgs(computed.length > 0 ? computed : DEMO_SUBJECT_AVGS);

      if (classes.length > 0) {
        const classGradeMap: Record<string, { sum: number; count: number }> = {};
        const classStudentMap: Record<string, Set<string>> = {};
        grades.forEach(g => {
          if (!g.class_id) return;
          if (!classGradeMap[g.class_id]) classGradeMap[g.class_id] = { sum: 0, count: 0 };
          classGradeMap[g.class_id].sum += g.grade;
          classGradeMap[g.class_id].count += 1;
          if (!classStudentMap[g.class_id]) classStudentMap[g.class_id] = new Set();
          classStudentMap[g.class_id].add(g.student_id);
        });
        const perf: ClassPerf[] = classes.map(cls => ({
          className: cls.name,
          gradeLevel: cls.grade_level,
          section: cls.section || '',
          avg: classGradeMap[cls.id]?.count > 0 ? parseFloat((classGradeMap[cls.id].sum / classGradeMap[cls.id].count).toFixed(2)) : 0,
          studentCount: classStudentMap[cls.id]?.size || 0,
        })).filter(c => c.avg > 0).sort((a, b) => a.gradeLevel - b.gradeLevel || a.section.localeCompare(b.section));
        setClassPerf(perf.length > 0 ? perf : DEMO_CLASS_PERF);
      } else {
        setClassPerf(DEMO_CLASS_PERF);
      }

      const { data: teachers } = await supabase.from('profiles').select('id, full_name').eq('role', 'mesues');
      const { data: classSubjects } = await supabase.from('class_subjects').select('teacher_id, class_id');

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthAgoStr = monthAgo.toISOString().split('T')[0];

      const teacherClassCount: Record<string, Set<string>> = {};
      classSubjects?.forEach(cs => {
        if (!teacherClassCount[cs.teacher_id]) teacherClassCount[cs.teacher_id] = new Set();
        teacherClassCount[cs.teacher_id].add(cs.class_id);
      });

      const teacherGradesMonth: Record<string, { count: number; lastDate: string | null }> = {};
      const teacherAttMonth: Record<string, number> = {};
      grades.filter(g => g.date >= monthAgoStr).forEach(g => {
        if (!g.teacher_id) return;
        if (!teacherGradesMonth[g.teacher_id]) teacherGradesMonth[g.teacher_id] = { count: 0, lastDate: null };
        teacherGradesMonth[g.teacher_id].count += 1;
        const cur = teacherGradesMonth[g.teacher_id].lastDate;
        if (!cur || g.date > cur) teacherGradesMonth[g.teacher_id].lastDate = g.date;
      });
      attendance.filter(a => a.date >= monthAgoStr).forEach((a: any) => {
        if (!a.recorded_by) return;
        teacherAttMonth[a.recorded_by] = (teacherAttMonth[a.recorded_by] || 0) + 1;
      });

      const activity: TeacherActivity[] = (teachers || []).map(t => ({
        id: t.id,
        name: t.full_name,
        classCount: teacherClassCount[t.id]?.size || 0,
        gradesThisMonth: teacherGradesMonth[t.id]?.count || 0,
        lastGradeDate: teacherGradesMonth[t.id]?.lastDate || null,
        attendanceThisMonth: teacherAttMonth[t.id] || 0,
      })).sort((a, b) => b.gradesThisMonth - a.gradesThisMonth);
      setTeacherActivity(activity.length > 0 ? activity : DEMO_TEACHER_ACTIVITY);

      const studentGradeMap: Record<string, { sum: number; count: number; classId: string }> = {};
      grades.forEach(g => {
        if (!g.student_id) return;
        if (!studentGradeMap[g.student_id]) studentGradeMap[g.student_id] = { sum: 0, count: 0, classId: g.class_id || '' };
        studentGradeMap[g.student_id].sum += g.grade;
        studentGradeMap[g.student_id].count += 1;
      });

      const studentAbsMap: Record<string, number> = {};
      attendance.filter(a => a.status === 'mungon').forEach(a => {
        studentAbsMap[a.student_id] = (studentAbsMap[a.student_id] || 0) + 1;
      });

      const atRiskIds = Object.entries(studentGradeMap)
        .map(([id, data]) => ({ id, avg: data.sum / data.count, classId: data.classId }))
        .filter(s => s.avg < 2.5)
        .slice(0, 10);

      if (atRiskIds.length > 0) {
        const { data: studentProfiles } = await supabase.from('profiles').select('id, full_name').in('id', atRiskIds.map(s => s.id));
        const classMap2: Record<string, string> = {};
        classes.forEach(c => { classMap2[c.id] = c.name; });
        const profileMap: Record<string, string> = {};
        studentProfiles?.forEach(p => { profileMap[p.id] = p.full_name; });

        const atRisk: AtRiskStudent[] = atRiskIds.map(s => ({
          id: s.id,
          name: profileMap[s.id] || '',
          className: classMap2[s.classId] || '',
          avg: parseFloat(s.avg.toFixed(1)),
          absences: studentAbsMap[s.id] || 0,
        })).filter(s => s.name).sort((a, b) => a.avg - b.avg);
        setAtRiskStudents(atRisk);
      } else {
        setAtRiskStudents([]);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading reports:', error);
      setSubjectAvgs(DEMO_SUBJECT_AVGS);
      setClassPerf(DEMO_CLASS_PERF);
      setTeacherActivity(DEMO_TEACHER_ACTIVITY);
      setAtRiskStudents(DEMO_AT_RISK);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  const maxSubjectAvg = Math.max(...subjectAvgs.map(s => s.avg), 1);
  const maxClassAvg = Math.max(...classPerf.map(c => c.avg), 1);

  const TABS: { id: ActiveTab; label: string; icon: React.ReactNode; alert?: number }[] = [
    { id: 'overview', label: 'Pasqyra', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'teachers', label: 'Aktiviteti i Mësuesve', icon: <GraduationCap className="w-4 h-4" />, alert: teacherActivity.filter(t => t.gradesThisMonth === 0).length || undefined },
    { id: 'atrisk', label: 'Nxënës në Rrezik', icon: <AlertTriangle className="w-4 h-4" />, alert: atRiskStudents.length || undefined },
    { id: 'attendance', label: 'Frekuentimi', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raportet</h1>
          <p className="text-slate-500 mt-1">Statistika dhe analiza — Sistemi i vlerësimit 1–5</p>
        </div>
        <button
          onClick={loadReports}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Rifresko
        </button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-slate-400">
          Përditësuar: {lastUpdated.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
          {isDemo && ' (të dhëna demo)'}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Mesatarja e Shkollës</p>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.schoolAvg}</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${(stats.schoolAvg / 5) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-500">Frekuentimi Mesatar</p>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.attendancePct}%</p>
          <p className="text-xs text-slate-400 mt-1">{stats.totalDays} regjistrime</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-emerald-600">Me notë 5</p>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.studentsWithFive}</p>
          <p className="text-xs text-emerald-500 mt-1">nxënës unikë</p>
        </div>
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-rose-600">Me notë 1</p>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-700">{stats.studentsWithOne}</p>
          <p className="text-xs text-rose-500 mt-1">nxënës — nevojë vëmendje</p>
        </div>
      </div>

      {atRiskStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">{atRiskStudents.length} nxënës me mesatare nën 2.5</p>
            <p className="text-xs text-amber-700 mt-0.5">Këta nxënës kanë nevojë për vëmendje dhe ndërhyrje nga mësuesi e drejtori.</p>
          </div>
          <button onClick={() => setActiveTab('atrisk')} className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
            Shiko <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 relative ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 bg-blue-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.alert && tab.alert > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full">
                  {tab.alert}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Mesatarja sipas Lëndës</h3>
                <div className="space-y-3">
                  {subjectAvgs.map((subject) => (
                    <div key={subject.name} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-32 flex-shrink-0 truncate">{subject.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            subject.avg >= 4.5 ? 'bg-emerald-400' : subject.avg >= 3.5 ? 'bg-blue-400' : subject.avg >= 2.5 ? 'bg-cyan-400' : subject.avg >= 1.5 ? 'bg-amber-400' : 'bg-rose-400'
                          }`}
                          style={{ width: `${(subject.avg / maxSubjectAvg) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-10 text-right tabular-nums">{subject.avg}</span>
                      <span className={`text-xs w-5 text-right flex items-center justify-end ${subject.avg >= 4.0 ? 'text-emerald-600' : subject.avg < 3.0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {subject.avg >= 4.0 && <ArrowUpRight className="w-3 h-3" />}
                        {subject.avg < 3.0 && <ArrowDownRight className="w-3 h-3" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-4">Performanca sipas Klasës</h3>
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {classPerf.map((cls) => (
                    <div key={cls.className} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700 w-10 bg-slate-100 rounded-lg px-2 py-1 text-center">{cls.className}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${cls.avg >= 4.0 ? 'bg-emerald-400' : cls.avg >= 3.5 ? 'bg-blue-400' : cls.avg >= 3.0 ? 'bg-cyan-400' : cls.avg >= 2.0 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${(cls.avg / maxClassAvg) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 w-10 text-right tabular-nums">{cls.avg}</span>
                      <span className="text-xs text-slate-400 w-14 text-right">{cls.studentCount} nx.</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  {[['bg-emerald-400', '≥ 4.0'], ['bg-blue-400', '3.5–3.9'], ['bg-cyan-400', '3.0–3.4'], ['bg-rose-400', '< 2.0']].map(([color, label]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 ${color} rounded`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Aktiviteti i Mësuesve — Këtë Muaj</h3>
                <Link to="/drejtor/mesazhet" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Dërgo Mesazh
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mësuesi</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Klasa</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nota/Muaj</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Frekvenc./Muaj</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nota e Fundit</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statusi</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teacherActivity.map((t) => {
                      const inactive = t.gradesThisMonth === 0;
                      const low = t.gradesThisMonth > 0 && t.gradesThisMonth < 10;
                      return (
                        <tr key={t.id} className={`transition-colors ${inactive ? 'bg-rose-50/40' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${inactive ? 'bg-rose-100 text-rose-600' : low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {t.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-900">{t.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-slate-700">{t.classCount}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-sm font-bold ${inactive ? 'bg-rose-100 text-rose-700' : low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {t.gradesThisMonth}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-sm font-bold ${t.attendanceThisMonth === 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                              {t.attendanceThisMonth}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {t.lastGradeDate
                              ? <span className="text-sm text-slate-600">{new Date(t.lastGradeDate).toLocaleDateString('sq-AL')}</span>
                              : <span className="text-xs text-rose-500 font-medium">Kurrë</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            {inactive ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">
                                <XCircle className="w-3 h-3" />
                                Joaktiv
                              </span>
                            ) : low ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                I ulët
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                <CheckCircle className="w-3 h-3" />
                                Aktiv
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link to="/drejtor/mesazhet" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all">
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {teacherActivity.filter(t => t.gradesThisMonth === 0).length > 0 && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                  <strong>{teacherActivity.filter(t => t.gradesThisMonth === 0).length} mësues</strong> nuk kanë regjistruar asnjë notë këtë muaj. Kontaktojini nëpërmjet mesazheve.
                </div>
              )}
            </div>
          )}

          {activeTab === 'atrisk' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">Nxënës në Rrezik Akademik</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Nxënës me mesatare nën 2.5 ose mungesa të larta</p>
                </div>
                <Link to="/drejtor/mesazhet" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Njofto Prindërit
                </Link>
              </div>
              {atRiskStudents.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                  <h3 className="text-slate-700 font-semibold">Asnjë nxënës në rrezik</h3>
                  <p className="text-sm text-slate-400 mt-1">Të gjithë nxënësit kanë mesatare mbi 2.5</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nxënësi</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Klasa</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mesatare</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mungesa</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Niveli i Rrezikut</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {atRiskStudents.map((s) => {
                        const highRisk = s.avg < 2.0 || s.absences > 15;
                        const medRisk = !highRisk && (s.avg < 2.5 || s.absences > 8);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${highRisk ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {s.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{s.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold">{s.className}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center w-10 h-8 rounded-lg text-sm font-bold ${s.avg < 2.0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {s.avg}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-sm font-bold ${s.absences > 15 ? 'bg-rose-100 text-rose-700' : s.absences > 8 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                {s.absences}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {highRisk ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  I lartë
                                </span>
                              ) : medRisk ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  Mesatar
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Link to="/drejtor/mesazhet" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all" title="Dërgo mesazh prindit">
                                  <MessageSquare className="w-4 h-4" />
                                </Link>
                                <Link to="/drejtor/nxenes" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all" title="Shiko profilin">
                                  <Users className="w-4 h-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#34d399" strokeWidth="3"
                      strokeDasharray={`${stats.attendancePct} ${100 - stats.attendancePct}`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-slate-900">{stats.attendancePct}%</span>
                    <span className="text-xs text-slate-500">Prezencë</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: stats.totalDays > 0 ? Math.round((stats.attendancePct / 100) * stats.totalDays) : 0, label: 'Prezente', color: 'bg-emerald-50 text-emerald-700' },
                    { value: stats.totalAbsences - stats.justifiedAbsences, label: 'Mungesa', color: 'bg-rose-50 text-rose-700' },
                    { value: stats.justifiedAbsences, label: 'Arsyeshme', color: 'bg-blue-50 text-blue-700' },
                    { value: stats.totalDays, label: 'Gjithsej', color: 'bg-slate-50 text-slate-700' },
                  ].map(item => (
                    <div key={item.label} className={`text-center p-3 rounded-xl ${item.color}`}>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Klasa me Mungesa të Larta</h3>
                <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-xl">
                  Të dhënat e detajuara sipas klasës shfaqen kur ka regjistrime të mjaftueshme.
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-sm text-blue-800">
                  Mësuesit duhet të regjistrojnë prezencën çdo ditë mësimorë. Kontrolloni faqen e aktivitetit të mësuesve për mungesa regjistrimesh.
                </div>
                <button onClick={() => setActiveTab('teachers')} className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1">
                  Kontrollo <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
