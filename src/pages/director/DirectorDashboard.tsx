import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import { GRADE_LABELS } from '../../types/database';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  TrendingUp,
  AlertCircle,
  Calendar,
  Award,
  UserPlus,
  FolderPlus,
  Megaphone,
  Loader2,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
}

interface GradeDistItem {
  grade: number;
  count: number;
}

interface AttendanceDayData {
  day: string;
  present: number;
  absent: number;
}

interface TopClassData {
  name: string;
  avg: number;
  students: number;
}

interface RecentAnnouncement {
  id: string;
  title: string;
  target_role: string;
  is_important: boolean;
  created_at: string;
}

interface AlertItem {
  type: 'warning' | 'info';
  message: string;
  action?: string;
  actionPath?: string;
}

export default function DirectorDashboard() {
  const { isDemo } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalStudents: 0, totalTeachers: 0, totalClasses: 0, totalSubjects: 0 });
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistItem[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceDayData[]>([]);
  const [topClasses, setTopClasses] = useState<TopClassData[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<RecentAnnouncement[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    if (isDemo) {
      setStats({ totalStudents: 245, totalTeachers: 18, totalClasses: 18, totalSubjects: 12 });
      setGradeDistribution([
        { grade: 5, count: 45 }, { grade: 4, count: 78 }, { grade: 3, count: 92 },
        { grade: 2, count: 38 }, { grade: 1, count: 12 },
      ]);
      setAttendanceData([
        { day: 'Hen', present: 92, absent: 8 }, { day: 'Mar', present: 89, absent: 11 },
        { day: 'Mer', present: 94, absent: 6 }, { day: 'Enj', present: 91, absent: 9 },
        { day: 'Pre', present: 88, absent: 12 },
      ]);
      setTopClasses([
        { name: 'Klasa 5-A', avg: 4.35, students: 28 },
        { name: 'Klasa 3-B', avg: 4.25, students: 25 },
        { name: 'Klasa 7-A', avg: 4.15, students: 30 },
        { name: 'Klasa 9-A', avg: 4.05, students: 27 },
        { name: 'Klasa 2-A', avg: 4.00, students: 26 },
      ]);
      setRecentAnnouncements([
        { id: '1', title: 'Mbledhje e pergjithshme me prinderit', target_role: 'prind', is_important: true, created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: '2', title: 'Ndryshim ne orarin e mesimit', target_role: 'te_gjithe', is_important: false, created_at: new Date(Date.now() - 86400000).toISOString() },
      ]);
      setAlerts([
        { type: 'warning', message: '1 mësues nuk ka regjistruar asnjë notë këtë muaj.', action: 'Shiko Raportet', actionPath: '/drejtor/raporte' },
        { type: 'warning', message: '4 nxënës kanë mesatare nën 2.5 — rrezik akademik.', action: 'Shiko Nxënësit', actionPath: '/drejtor/raporte' },
        { type: 'info', message: '3 mungesa frekuentimi pa arsyetim në javën e kaluar.', action: 'Shiko Frekuentimin', actionPath: '/drejtor/raporte' },
      ]);
      setLoading(false);
      return;
    }

    try {
      const [studentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'nxenes'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mesues'),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalSubjects: subjectsRes.count || 0,
      });

      const { data: gradesData } = await supabase.from('grades').select('grade');
      if (gradesData && gradesData.length > 0) {
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        gradesData.forEach(g => { counts[g.grade] = (counts[g.grade] || 0) + 1; });
        setGradeDistribution([5, 4, 3, 2, 1].map(g => ({ grade: g, count: counts[g] })));
      } else {
        setGradeDistribution([5, 4, 3, 2, 1].map(g => ({ grade: g, count: 0 })));
      }

      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const weekDays = ['Hen', 'Mar', 'Mer', 'Enj', 'Pre'];
      const attWeek: AttendanceDayData[] = [];

      const { data: attData } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', monday.toISOString().split('T')[0])
        .lte('date', new Date(monday.getTime() + 4 * 86400000).toISOString().split('T')[0]);

      for (let i = 0; i < 5; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = attData?.filter(a => a.date === dateStr) || [];
        const total = dayRecords.length || 1;
        const presentCount = dayRecords.filter(a => a.status === 'prezent' || a.status === 'vonese').length;
        const absentCount = total - presentCount;
        attWeek.push({
          day: weekDays[i],
          present: Math.round((presentCount / total) * 100),
          absent: Math.round((absentCount / total) * 100),
        });
      }
      setAttendanceData(attWeek);

      const { data: classGrades } = await supabase
        .from('grades')
        .select('class_id, grade, classes(name)');

      if (classGrades && classGrades.length > 0) {
        const classMap: Record<string, { name: string; total: number; count: number }> = {};
        classGrades.forEach((g: any) => {
          if (!classMap[g.class_id]) {
            classMap[g.class_id] = { name: g.classes?.name || '', total: 0, count: 0 };
          }
          classMap[g.class_id].total += g.grade;
          classMap[g.class_id].count += 1;
        });

        const { data: enrollments } = await supabase
          .from('student_classes')
          .select('class_id');

        const enrollmentCounts: Record<string, number> = {};
        enrollments?.forEach(e => {
          enrollmentCounts[e.class_id] = (enrollmentCounts[e.class_id] || 0) + 1;
        });

        const sorted = Object.entries(classMap)
          .map(([classId, data]) => ({
            name: data.name,
            avg: Number((data.total / data.count).toFixed(2)),
            students: enrollmentCounts[classId] || 0,
          }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);

        setTopClasses(sorted);
      }

      const { data: annData } = await supabase
        .from('announcements')
        .select('id, title, target_role, is_important, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentAnnouncements(annData || []);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const GRADE_COLORS: Record<number, string> = {
    5: 'bg-emerald-500', 4: 'bg-blue-400', 3: 'bg-cyan-400', 2: 'bg-amber-400', 1: 'bg-rose-400',
  };

  const TARGET_LABELS: Record<string, string> = {
    te_gjithe: 'Te Gjithe', mesues: 'Mesuesit', nxenes: 'Nxenesit', prind: 'Prinderit',
  };

  const maxGradeCount = Math.max(...gradeDistribution.map(g => g.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paneli Kryesor</h1>
        <p className="text-slate-500 mt-1">Pasqyra e pergjithshme e shkolles - Republika e Kosoves</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Nxenes Gjithsej" value={stats.totalStudents} icon={Users} color="blue" />
        <StatCard label="Mesues" value={stats.totalTeachers} icon={GraduationCap} color="teal" />
        <StatCard label="Klasa" value={stats.totalClasses} icon={Layers} color="amber" />
        <StatCard label="Lende" value={stats.totalSubjects} icon={BookOpen} color="cyan" />
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${alert.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              {alert.type === 'warning'
                ? <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              <span className="flex-1">{alert.message}</span>
              {alert.action && alert.actionPath && (
                <Link to={alert.actionPath} className={`flex items-center gap-1 text-xs font-semibold whitespace-nowrap ${alert.type === 'warning' ? 'text-amber-700 hover:text-amber-900' : 'text-blue-700 hover:text-blue-900'}`}>
                  {alert.action} <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Veprime te Shpejta</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/drejtor/mesues', icon: <UserPlus className="w-6 h-6" />, label: 'Mësuesit' },
            { to: '/drejtor/nxenes', icon: <Users className="w-6 h-6" />, label: 'Nxënësit' },
            { to: '/drejtor/klasa', icon: <FolderPlus className="w-6 h-6" />, label: 'Klasat' },
            { to: '/drejtor/njoftime', icon: <Megaphone className="w-6 h-6" />, label: 'Njoftimet' },
            { to: '/drejtor/raporte', icon: <BarChart3 className="w-6 h-6" />, label: 'Raportet' },
            { to: '/drejtor/mesazhet', icon: <MessageSquare className="w-6 h-6" />, label: 'Mesazhet' },
          ].map(item => (
            <Link key={item.to} to={item.to} className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">{item.icon}</div>
              <span className="text-sm font-medium text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Shperndarja e Notave</h3>
              <p className="text-sm text-slate-500 mt-0.5">Semestri aktual (Shkalla 1-5)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          {gradeDistribution.some(g => g.count > 0) ? (
            <div className="space-y-3">
              {gradeDistribution.map((g) => (
                <div key={g.grade} className="flex items-center gap-3">
                  <div className="w-20 flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 w-4">{g.grade}</span>
                    <span className="text-xs text-slate-400 truncate">{GRADE_LABELS[g.grade]}</span>
                  </div>
                  <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                    <div
                      className={`${GRADE_COLORS[g.grade]} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700`}
                      style={{ width: `${Math.max((g.count / maxGradeCount) * 100, g.count > 0 ? 12 : 0)}%` }}
                    >
                      {g.count > 0 && <span className="text-xs font-bold text-white">{g.count}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nuk ka nota te regjistruara ende
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Frekuentimi Javor</h3>
              <p className="text-sm text-slate-500 mt-0.5">Perqindja e prezences</p>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </div>
          {attendanceData.some(d => d.present > 0 || d.absent > 0) ? (
            <>
              <div className="flex items-end gap-3 h-48">
                {attendanceData.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col gap-0.5" style={{ height: '160px' }}>
                      <div className="bg-rose-100 rounded-t-lg w-full transition-all duration-500" style={{ height: `${d.absent}%` }} />
                      <div className="bg-emerald-400 rounded-b-lg w-full transition-all duration-500" style={{ height: `${d.present}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{d.day}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded" />
                  <span className="text-xs text-slate-500">Prezent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-100 rounded" />
                  <span className="text-xs text-slate-500">Mungese</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nuk ka te dhena te frekuentimit per kete jave
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Njoftimet e Fundit</h3>
            <Link to="/drejtor/njoftime" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Te gjitha
            </Link>
          </div>
          {recentAnnouncements.length > 0 ? (
            <div className="space-y-3">
              {recentAnnouncements.map((ann) => (
                <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${ann.is_important ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                    {ann.is_important ? <AlertCircle className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium">{ann.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {TARGET_LABELS[ann.target_role] || ann.target_role}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(ann.created_at).toLocaleDateString('sq-AL')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">Nuk ka njoftime</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Klasat me te Mira</h3>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          {topClasses.length > 0 ? (
            <div className="space-y-3">
              {topClasses.map((cls, i) => (
                <div key={cls.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-slate-100 text-slate-600' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{cls.name}</p>
                    <p className="text-xs text-slate-400">{cls.students} nxenes</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      cls.avg >= 4.5 ? 'text-emerald-600' :
                      cls.avg >= 3.5 ? 'text-blue-600' :
                      'text-cyan-600'
                    }`}>{cls.avg}</p>
                    <p className="text-xs text-slate-400">mesatare</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">Nuk ka te dhena</div>
          )}
        </div>
      </div>
    </div>
  );
}
