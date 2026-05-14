import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/StatCard';
import { getGradeBgColor } from '../../types/database';
import {
  Award,
  TrendingUp,
  Calendar,
  Clock,
  BookOpen,
  ChevronRight,
  Star,
  Loader2,
  AlertCircle,
  MessageSquare,
  Megaphone,
} from 'lucide-react';

interface SubjectAvg {
  name: string;
  avg: number;
  count: number;
}

interface RecentGrade {
  subject: string;
  grade: number;
  type: string;
  date: string;
  teacher: string;
}

interface ScheduleItem {
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

interface Ann {
  title: string;
  content: string;
  important: boolean;
}

export default function StudentDashboard() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('');
  const [overallAvg, setOverallAvg] = useState('0');
  const [monthGrades, setMonthGrades] = useState(0);
  const [absences, setAbsences] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAvg[]>([]);
  const [announcements, setAnnouncements] = useState<Ann[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (isDemo) {
      setClassName('Klasa 7-A');
      setOverallAvg('4.1');
      setMonthGrades(12);
      setAbsences(3);
      setTodaySchedule([
        { time: '08:00 - 08:45', subject: 'Matematike', teacher: 'Znj. Hoxha', room: 'Salla 12' },
        { time: '08:50 - 09:35', subject: 'Gjuhe Shqipe', teacher: 'Z. Krasniqi', room: 'Salla 8' },
        { time: '09:50 - 10:35', subject: 'Anglisht', teacher: 'Znj. Shehu', room: 'Salla 5' },
        { time: '10:40 - 11:25', subject: 'Histori', teacher: 'Z. Krasniqi', room: 'Salla 8' },
        { time: '11:40 - 12:25', subject: 'Edukim Fizik', teacher: 'Z. Dervishi', room: 'Palestra' },
      ]);
      setRecentGrades([
        { subject: 'Matematike', grade: 5, type: 'Vlersim', date: 'Sot', teacher: 'Znj. Hoxha' },
        { subject: 'Anglisht', grade: 4, type: 'Vlersim', date: 'Dje', teacher: 'Znj. Shehu' },
        { subject: 'Gjuhe Shqipe', grade: 5, type: 'Vlersim', date: '2 dite me pare', teacher: 'Z. Krasniqi' },
        { subject: 'Biologji', grade: 3, type: 'Vlersim', date: '3 dite me pare', teacher: 'Z. Basha' },
        { subject: 'Histori', grade: 4, type: 'Vlersim', date: '1 jave me pare', teacher: 'Z. Krasniqi' },
      ]);
      setSubjectAverages([
        { name: 'Matematike', avg: 4.3, count: 8 }, { name: 'Gjuhe Shqipe', avg: 4.6, count: 7 },
        { name: 'Anglisht', avg: 4.1, count: 6 }, { name: 'Histori', avg: 3.9, count: 5 },
        { name: 'Biologji', avg: 3.8, count: 6 }, { name: 'Fizike', avg: 3.6, count: 5 },
      ]);
      setAnnouncements([
        { title: 'Provim i matematikës — E Mërkurë', content: 'Kapitulli 4 dhe 5. Sillni kalkulator.', important: true },
        { title: 'Ndryshim në orar — E Premte', content: 'Ora e gjeografisë zhvendoset në orën 10:40.', important: false },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: enrollment } = await supabase
        .from('student_classes')
        .select('class_id, classes(name)')
        .eq('student_id', profile?.id)
        .maybeSingle();

      if (!enrollment) {
        setLoading(false);
        return;
      }

      setClassName((enrollment as any).classes?.name || '');

      const [gradesRes, attRes] = await Promise.all([
        supabase.from('grades').select('grade, subject_id, date, assessment_type, teacher_id, created_at, subjects(name)').eq('student_id', profile?.id).order('created_at', { ascending: false }),
        supabase.from('attendance').select('status').eq('student_id', profile?.id).in('status', ['mungon']),
      ]);

      const grades = gradesRes.data || [];
      setAbsences(attRes.data?.length || 0);

      if (grades.length > 0) {
        const avg = (grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1);
        setOverallAvg(avg);

        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setMonthGrades(grades.filter(g => new Date(g.created_at) >= monthAgo).length);

        const subjectMap: Record<string, { total: number; count: number; name: string }> = {};
        grades.forEach((g: any) => {
          const sName = g.subjects?.name || '';
          if (!subjectMap[g.subject_id]) subjectMap[g.subject_id] = { total: 0, count: 0, name: sName };
          subjectMap[g.subject_id].total += g.grade;
          subjectMap[g.subject_id].count += 1;
        });

        setSubjectAverages(Object.values(subjectMap).map(s => ({
          name: s.name,
          avg: Number((s.total / s.count).toFixed(1)),
          count: s.count,
        })).sort((a, b) => b.avg - a.avg));

        const teacherIds = [...new Set(grades.slice(0, 5).map(g => g.teacher_id))];
        const { data: teachers } = await supabase.from('profiles').select('id, full_name').in('id', teacherIds);
        const teacherMap: Record<string, string> = {};
        teachers?.forEach(t => { teacherMap[t.id] = t.full_name; });

        const TYPE_LABELS: Record<string, string> = { vlersim: 'Vlersim', perfundimtare_gjysmvjetor: 'Gjysmvjetor', perfundimtare_vjetor: 'Vjetor' };

        setRecentGrades(grades.slice(0, 5).map((g: any) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          let dateLabel = new Date(g.date).toLocaleDateString('sq-AL');
          if (g.date === today) dateLabel = 'Sot';
          else if (g.date === yesterday) dateLabel = 'Dje';

          return {
            subject: g.subjects?.name || '',
            grade: g.grade,
            type: TYPE_LABELS[g.assessment_type] || g.assessment_type,
            date: dateLabel,
            teacher: teacherMap[g.teacher_id] || '',
          };
        }));
      }

      const todayDow = new Date().getDay();
      const dow = todayDow === 0 ? 7 : todayDow;
      if (dow >= 1 && dow <= 5) {
        const { data: schedData } = await supabase
          .from('schedule')
          .select('start_time, end_time, room, subjects(name), profiles(full_name)')
          .eq('class_id', enrollment.class_id)
          .eq('day_of_week', dow)
          .eq('is_active', true)
          .order('start_time');

        if (schedData) {
          setTodaySchedule(schedData.map((s: any) => ({
            time: `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`,
            subject: s.subjects?.name || '',
            teacher: s.profiles?.full_name || '',
            room: s.room || '',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading student dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paneli Kryesor</h1>
        <p className="text-slate-500 mt-1">{className || 'Pa klase'} - Semestri II, 2025-2026</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mesatarja Ime" value={overallAvg} icon={Award} color="cyan" />
        <StatCard label="Nota kete muaj" value={monthGrades} icon={TrendingUp} color="blue" />
        <StatCard label="Mungesa" value={absences} icon={Calendar} color="rose" />
        <StatCard label="Lende" value={subjectAverages.length} icon={BookOpen} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
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
                    i === 0 ? 'bg-cyan-50 border border-cyan-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-mono text-slate-500 w-28 flex-shrink-0">{item.time}</div>
                  <div className={`w-1 h-10 rounded-full ${i === 0 ? 'bg-cyan-400' : 'bg-slate-200'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500">{item.teacher} - {item.room}</p>
                  </div>
                  {i === 0 && (
                    <span className="text-xs px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-full font-medium animate-pulse">Tani</span>
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
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Notat e Fundit</h3>
            </div>
            <Link to="/nxenes/nota" className="text-sm text-cyan-600 hover:text-cyan-800 font-medium flex items-center gap-1">
              Te gjitha <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentGrades.length > 0 ? (
            <div className="space-y-3">
              {recentGrades.map((g, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${getGradeBgColor(g.grade)}`}>
                    {g.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{g.subject}</p>
                    <p className="text-xs text-slate-500">{g.teacher}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">{g.type}</span>
                    <p className="text-xs text-slate-400 mt-1">{g.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Nuk ka nota ende</p>
            </div>
          )}
        </div>
      </div>

      {subjectAverages.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">Mesatarja sipas Lendes</h3>
            </div>
            <div className="text-sm text-slate-500">
              Mesatarja e pergjithshme: <span className="font-bold text-slate-900">{overallAvg}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjectAverages.map((subject) => (
              <div key={subject.name} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:border-slate-200 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  subject.avg >= 4.5 ? 'bg-emerald-100 text-emerald-700' :
                  subject.avg >= 4 ? 'bg-blue-100 text-blue-700' :
                  subject.avg >= 3 ? 'bg-cyan-100 text-cyan-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {subject.avg}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{subject.name}</p>
                  <p className="text-xs text-slate-400">{subject.count} nota</p>
                </div>
                <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      subject.avg >= 4.5 ? 'bg-emerald-400' :
                      subject.avg >= 4 ? 'bg-blue-400' :
                      subject.avg >= 3 ? 'bg-cyan-400' :
                      'bg-amber-400'
                    }`}
                    style={{ width: `${(subject.avg / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-slate-900">Njoftime nga Shkolla</h3>
            </div>
          </div>
          {announcements.length > 0 ? (
            <div className="space-y-3">
              {announcements.map((ann, i) => (
                <div key={i} className={`p-3 rounded-xl border ${ann.important ? 'border-amber-200 bg-amber-50' : 'border-slate-100'}`}>
                  <p className="text-sm font-semibold text-slate-900">{ann.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{ann.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Nuk ka njoftime aktive</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-cyan-500" />
            <h3 className="font-semibold text-slate-900">Veprime të Shpejta</h3>
          </div>
          <div className="space-y-2">
            {[
              { to: '/nxenes/nota', icon: <Award className="w-4 h-4" />, label: 'Notat e Mia', desc: 'Shiko të gjitha notat sipas lëndës' },
              { to: '/nxenes/orari', icon: <Clock className="w-4 h-4" />, label: 'Orari Javor', desc: 'Shiko orarin e plotë' },
              { to: '/nxenes/frekuentimi', icon: <Calendar className="w-4 h-4" />, label: 'Frekuentimi Im', desc: 'Shiko mungesat dhe prezencën' },
              { to: '/nxenes/mesazhet', icon: <MessageSquare className="w-4 h-4" />, label: 'Mesazhe — Mësuesi', desc: 'Dërgo mesazh mësuesit tënd' },
            ].map(item => (
              <Link key={item.to} to={item.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100 transition-colors">
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
