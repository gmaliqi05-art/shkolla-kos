import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/StatCard';
import { getGradeBgColor } from '../../types/database';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  CalendarDays,
  AlertTriangle,
  MessageSquare,
  Send,
} from 'lucide-react';

interface ClassInfo {
  classSubjectId: string;
  classId: string;
  className: string;
  subjectName: string;
  studentCount: number;
  avgGrade: number;
}

interface ScheduleItem {
  time: string;
  subject: string;
  className: string;
  room: string;
}

interface RecentGrade {
  studentName: string;
  className: string;
  subjectName: string;
  grade: number;
  assessmentType: string;
  date: string;
}

interface AtRiskStudent {
  name: string;
  className: string;
  subjectName: string;
  avg: number;
  absences: number;
}

export default function TeacherDashboard() {
  const { profile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [recentGradesCount, setRecentGradesCount] = useState(0);
  const [overallAvg, setOverallAvg] = useState('0');
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [myClasses, setMyClasses] = useState<ClassInfo[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (isDemo) {
      setTotalClasses(5);
      setTotalStudents(140);
      setRecentGradesCount(24);
      setOverallAvg('3.88');
      setTodaySchedule([
        { time: '08:00 - 08:45', subject: 'Matematike', className: 'Klasa 5-A', room: 'Salla 12' },
        { time: '08:50 - 09:35', subject: 'Matematike', className: 'Klasa 7-A', room: 'Salla 12' },
        { time: '09:50 - 10:35', subject: 'Fizike', className: 'Klasa 8-A', room: 'Lab. Fizikes' },
        { time: '10:40 - 11:25', subject: 'Matematike', className: 'Klasa 9-A', room: 'Salla 15' },
        { time: '11:40 - 12:25', subject: 'Fizike', className: 'Klasa 7-B', room: 'Lab. Fizikes' },
      ]);
      setMyClasses([
        { classSubjectId: '1', classId: 'cl-1', className: 'Klasa 5-A', subjectName: 'Matematike', studentCount: 28, avgGrade: 4.1 },
        { classSubjectId: '2', classId: 'cl-2', className: 'Klasa 7-A', subjectName: 'Matematike', studentCount: 30, avgGrade: 3.9 },
        { classSubjectId: '3', classId: 'cl-3', className: 'Klasa 8-A', subjectName: 'Fizike', studentCount: 27, avgGrade: 3.8 },
      ]);
      setRecentGrades([
        { studentName: 'Ardi Malaj', className: '5-A', subjectName: 'Matematike', grade: 5, assessmentType: 'Vlersim', date: 'Sot' },
        { studentName: 'Besa Koci', className: '5-A', subjectName: 'Matematike', grade: 5, assessmentType: 'Vlersim', date: 'Sot' },
        { studentName: 'Dion Gashi', className: '7-A', subjectName: 'Matematike', grade: 3, assessmentType: 'Vlersim', date: 'Dje' },
      ]);
      setAtRiskStudents([
        { name: 'Besian Kelmendi', className: 'Klasa 8-A', subjectName: 'Matematike', avg: 1.8, absences: 12 },
        { name: 'Lirije Stublla', className: 'Klasa 7-A', subjectName: 'Matematike', avg: 2.1, absences: 8 },
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
        setLoading(false);
        return;
      }

      setTotalClasses(classSubjects.length);

      const classIds = [...new Set(classSubjects.map(cs => cs.class_id))];

      const { data: enrollments } = await supabase
        .from('student_classes')
        .select('class_id')
        .in('class_id', classIds);

      const enrollMap: Record<string, number> = {};
      enrollments?.forEach(e => { enrollMap[e.class_id] = (enrollMap[e.class_id] || 0) + 1; });
      const totalStud = Object.values(enrollMap).reduce((s, c) => s + c, 0);
      setTotalStudents(totalStud);

      const { data: allGrades } = await supabase
        .from('grades')
        .select('grade, class_id, subject_id, student_id, assessment_type, date, created_at')
        .eq('teacher_id', profile?.id)
        .order('created_at', { ascending: false });

      if (allGrades && allGrades.length > 0) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recent = allGrades.filter(g => new Date(g.created_at) >= weekAgo);
        setRecentGradesCount(recent.length);

        const avg = (allGrades.reduce((s, g) => s + g.grade, 0) / allGrades.length).toFixed(2);
        setOverallAvg(avg);

        const classAvgs: Record<string, { total: number; count: number }> = {};
        allGrades.forEach(g => {
          const key = `${g.class_id}_${g.subject_id}`;
          if (!classAvgs[key]) classAvgs[key] = { total: 0, count: 0 };
          classAvgs[key].total += g.grade;
          classAvgs[key].count += 1;
        });

        const classInfos: ClassInfo[] = classSubjects.map((cs: any) => {
          const key = `${cs.class_id}_${cs.subject_id}`;
          const gradeData = classAvgs[key];
          return {
            classSubjectId: cs.id,
            classId: cs.class_id,
            className: cs.classes?.name || '',
            subjectName: cs.subjects?.name || '',
            studentCount: enrollMap[cs.class_id] || 0,
            avgGrade: gradeData ? Number((gradeData.total / gradeData.count).toFixed(1)) : 0,
          };
        });
        setMyClasses(classInfos);

        const recentFive = allGrades.slice(0, 5);
        const studentIds = recentFive.map(g => g.student_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', studentIds);

        const profileMap: Record<string, string> = {};
        profiles?.forEach(p => { profileMap[p.id] = p.full_name; });

        const subjectMap: Record<string, string> = {};
        classSubjects.forEach((cs: any) => { subjectMap[cs.subject_id] = cs.subjects?.name || ''; });
        const classNameMap: Record<string, string> = {};
        classSubjects.forEach((cs: any) => { classNameMap[cs.class_id] = cs.classes?.name || ''; });

        const TYPE_LABELS: Record<string, string> = {
          vlersim: 'Vlersim',
          perfundimtare_gjysmvjetor: 'Gjysmvjetor',
          perfundimtare_vjetor: 'Vjetor',
        };

        const recentGradesList: RecentGrade[] = recentFive.map(g => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          let dateLabel = new Date(g.date).toLocaleDateString('sq-AL');
          if (g.date === today) dateLabel = 'Sot';
          else if (g.date === yesterday) dateLabel = 'Dje';

          return {
            studentName: profileMap[g.student_id] || '',
            className: classNameMap[g.class_id]?.replace('Klasa ', '') || '',
            subjectName: subjectMap[g.subject_id] || '',
            grade: g.grade,
            assessmentType: TYPE_LABELS[g.assessment_type] || g.assessment_type,
            date: dateLabel,
          };
        });
        setRecentGrades(recentGradesList);
      } else {
        setMyClasses(classSubjects.map((cs: any) => ({
          classSubjectId: cs.id,
          classId: cs.class_id,
          className: cs.classes?.name || '',
          subjectName: cs.subjects?.name || '',
          studentCount: enrollMap[cs.class_id] || 0,
          avgGrade: 0,
        })));
      }

      const todayDow = new Date().getDay();
      const dow = todayDow === 0 ? 7 : todayDow;

      if (dow >= 1 && dow <= 5) {
        const { data: schedData } = await supabase
          .from('schedule')
          .select('start_time, end_time, room, subjects(name), classes(name)')
          .eq('teacher_id', profile?.id)
          .eq('day_of_week', dow)
          .order('start_time');

        if (schedData) {
          setTodaySchedule(schedData.map((s: any) => ({
            time: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`,
            subject: s.subjects?.name || '',
            className: s.classes?.name || '',
            room: s.room || '',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading teacher dashboard:', error);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paneli Kryesor</h1>
        <p className="text-slate-500 mt-1">Mire se vini ne panelin e mesuesit</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Klasat e Mia" value={totalClasses} icon={BookOpen} color="teal" />
        <StatCard label="Nxenes Gjithsej" value={totalStudents} icon={Users} color="blue" />
        <StatCard label="Nota kete jave" value={recentGradesCount} icon={ClipboardCheck} color="amber" />
        <StatCard label="Mesatarja" value={overallAvg} icon={TrendingUp} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-500" />
              <h3 className="font-semibold text-slate-900">Orari i Sotem</h3>
            </div>
            <span className="text-xs text-slate-400">
              {new Date().toLocaleDateString('sq-AL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    i === 0 ? 'bg-teal-50 border border-teal-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-mono text-slate-500 w-28 flex-shrink-0">{item.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.className} - {item.room}</p>
                  </div>
                  {i === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">Tani</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nuk ka ore mesimi per sot</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">Klasat e Mia</h3>
            </div>
            <Link to="/mesues/klasa" className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
              Te gjitha <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {myClasses.length > 0 ? (
            <div className="space-y-3">
              {myClasses.slice(0, 5).map((cls) => (
                <div key={cls.classSubjectId} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{cls.className}</p>
                    <p className="text-xs text-slate-500">{cls.subjectName} - {cls.studentCount} nxenes</p>
                  </div>
                  <button
                    onClick={() => navigate('/mesues/orari')}
                    title="Shiko orarin e kesaj klase"
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 transition-all"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    Orari
                  </button>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      cls.avgGrade >= 4 ? 'text-emerald-600' :
                      cls.avgGrade >= 3 ? 'text-blue-600' :
                      cls.avgGrade > 0 ? 'text-amber-600' :
                      'text-slate-400'
                    }`}>
                      {cls.avgGrade > 0 ? cls.avgGrade : '-'}
                    </p>
                    <p className="text-xs text-slate-400">mesatare</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nuk jeni caktuar ne asnje klase</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Notat e Fundit</h3>
          <Link to="/mesues/nota" className="text-sm text-teal-600 hover:text-teal-800 font-medium flex items-center gap-1">
            Shiko te gjitha <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {recentGrades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nxenesi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Klasa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lenda</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nota</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lloji</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentGrades.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {g.studentName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{g.studentName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{g.className}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{g.subjectName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${getGradeBgColor(g.grade)}`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{g.assessmentType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{g.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nuk ka nota te regjistruara ende</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {atRiskStudents.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Nxënës në Rrezik</h3>
                  <p className="text-xs text-slate-500">Mesatare nën 2.5 ose mungesa të larta</p>
                </div>
              </div>
              <Link to="/mesues/mesazhet" className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-800">
                <Send className="w-3.5 h-3.5" />
                Njofto Prindërit
              </Link>
            </div>
            <div className="space-y-3">
              {atRiskStudents.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-sm font-bold text-amber-700">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.className} — {s.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-rose-600">{s.avg}</p>
                    <p className="text-xs text-slate-400">{s.absences} mung.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-teal-500" />
            <h3 className="font-semibold text-slate-900">Komunikimi</h3>
          </div>
          <div className="space-y-2">
            {[
              { to: '/mesues/mesazhet', icon: <MessageSquare className="w-4 h-4" />, label: 'Mesazhe — Drejtor / Prindër', desc: 'Dërgo ose lexo mesazhe' },
              { to: '/mesues/nota', icon: <ClipboardCheck className="w-4 h-4" />, label: 'Regjistro Nota', desc: 'Shto vlerësimet e nxënësve' },
              { to: '/mesues/frekuentimi', icon: <Calendar className="w-4 h-4" />, label: 'Regjistro Frekuentimin', desc: 'Shëno prezencën e sotme' },
              { to: '/mesues/orari', icon: <CalendarDays className="w-4 h-4" />, label: 'Shiko / Ndrysho Orarin', desc: 'Menaxho oraret mësimore' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
