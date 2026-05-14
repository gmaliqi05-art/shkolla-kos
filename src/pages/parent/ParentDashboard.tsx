import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/StatCard';
import { getGradeBgColor } from '../../types/database';
import {
  Award, TrendingUp, Calendar, BookOpen, ChevronRight, Star,
  AlertCircle, Check, X, Clock, Megaphone, Loader2, Users, ChevronDown,
  MessageSquare, GraduationCap,
} from 'lucide-react';

type AttStatus = 'prezent' | 'mungon' | 'vonese' | 'arsyeshme';

interface RecentGrade { subject: string; grade: number; type: string; date: string; }
interface SubjectAvg { name: string; avg: number; count: number; }
interface Ann { title: string; content: string; important: boolean; }
interface WeekDay { day: string; status: AttStatus; }

const STATUS_CONFIG = {
  prezent: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  mungon: { icon: X, color: 'text-rose-600', bg: 'bg-rose-100' },
  vonese: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  arsyeshme: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
};

const TYPE_LABELS: Record<string, string> = {
  vlersim: 'Vlersim',
  perfundimtare_gjysmvjetor: 'Gjysmvjetor',
  perfundimtare_vjetor: 'Vjetor',
};

export default function ParentDashboard() {
  const { profile, isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childName, setChildName] = useState('');
  const [className, setClassName] = useState('');
  const [overallAvg, setOverallAvg] = useState('0');
  const [monthGrades, setMonthGrades] = useState(0);
  const [absences, setAbsences] = useState(0);
  const [subjectCount, setSubjectCount] = useState(0);
  const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
  const [weekAttendance, setWeekAttendance] = useState<WeekDay[]>([]);
  const [announcements, setAnnouncements] = useState<Ann[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAvg[]>([]);

  useEffect(() => { loadChildren(); }, [profile]);
  useEffect(() => { if (selectedChildId) loadChildData(selectedChildId); }, [selectedChildId]);

  const loadChildren = async () => {
    if (!profile) return;

    if (isDemo) {
      const demoChildren = [{ id: 'demo-child-1', name: 'Ardi Malaj' }];
      setChildren(demoChildren);
      setSelectedChildId(demoChildren[0].id);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('parent_students')
        .select('student_id, profiles:student_id(id, full_name)')
        .eq('parent_id', profile.id);

      const childList = (data || []).map((ps: any) => ({
        id: ps.student_id,
        name: ps.profiles?.full_name || '',
      }));

      setChildren(childList);
      if (childList.length > 0) setSelectedChildId(childList[0].id);
      else setLoading(false);
    } catch (err) {
      console.error('Error loading children:', err);
      setLoading(false);
    }
  };

  const loadChildData = async (childId: string) => {
    setDataLoading(true);

    if (isDemo) {
      setChildName('Ardi Malaj');
      setClassName('Klasa 7-A');
      setOverallAvg('4.2');
      setMonthGrades(12);
      setAbsences(3);
      setSubjectCount(8);
      setRecentGrades([
        { subject: 'Matematike', grade: 5, type: 'Vlersim', date: 'Sot' },
        { subject: 'Anglisht', grade: 4, type: 'Vlersim', date: 'Dje' },
        { subject: 'Gjuhe Shqipe', grade: 5, type: 'Vlersim', date: '2 dite me pare' },
        { subject: 'Biologji', grade: 3, type: 'Vlersim', date: '3 dite me pare' },
        { subject: 'Histori', grade: 4, type: 'Vlersim', date: '1 jave me pare' },
      ]);
      setWeekAttendance([
        { day: 'Hen', status: 'prezent' }, { day: 'Mar', status: 'prezent' },
        { day: 'Mer', status: 'prezent' }, { day: 'Enj', status: 'vonese' },
        { day: 'Pre', status: 'prezent' },
      ]);
      setAnnouncements([
        { title: 'Mbledhje me prinderit', content: 'Diten e enjte ne oren 17:00', important: true },
        { title: 'Ekskursion ne Berat', content: 'Data: 15 Mars - Kostoja 2000 ALL', important: false },
      ]);
      setSubjectAverages([
        { name: 'Matematike', avg: 4.3, count: 8 },
        { name: 'Gjuhe Shqipe', avg: 4.6, count: 7 },
        { name: 'Anglisht', avg: 4.1, count: 6 },
        { name: 'Histori', avg: 3.9, count: 5 },
        { name: 'Gjeografi', avg: 4.0, count: 4 },
        { name: 'Biologji', avg: 3.8, count: 6 },
        { name: 'Fizike', avg: 3.6, count: 5 },
        { name: 'Kimi', avg: 3.5, count: 4 },
      ]);
      setLoading(false);
      setDataLoading(false);
      return;
    }

    try {
      const child = children.find(c => c.id === childId);
      setChildName(child?.name || '');

      const { data: enrollment } = await supabase
        .from('student_classes')
        .select('class_id, classes(name)')
        .eq('student_id', childId)
        .maybeSingle();

      if (enrollment) setClassName((enrollment as any).classes?.name || '');

      const [gradesRes, attRes, annRes] = await Promise.all([
        supabase.from('grades')
          .select('grade, subject_id, date, assessment_type, created_at, subjects(name)')
          .eq('student_id', childId)
          .order('created_at', { ascending: false }),
        supabase.from('attendance')
          .select('date, status')
          .eq('student_id', childId)
          .order('date', { ascending: false }),
        supabase.from('announcements')
          .select('title, content, is_important')
          .in('target_role', ['prind', 'te_gjithe'])
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const grades = gradesRes.data || [];
      const attRecords = attRes.data || [];

      setAbsences(attRecords.filter(r => r.status === 'mungon').length);

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

        const sAvgs = Object.values(subjectMap).map(s => ({
          name: s.name,
          avg: Number((s.total / s.count).toFixed(1)),
          count: s.count,
        })).sort((a, b) => b.avg - a.avg);

        setSubjectAverages(sAvgs);
        setSubjectCount(sAvgs.length);

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        setRecentGrades(grades.slice(0, 5).map((g: any) => {
          let dateLabel = new Date(g.date).toLocaleDateString('sq-AL');
          if (g.date === today) dateLabel = 'Sot';
          else if (g.date === yesterday) dateLabel = 'Dje';
          return {
            subject: g.subjects?.name || '',
            grade: g.grade,
            type: TYPE_LABELS[g.assessment_type] || g.assessment_type,
            date: dateLabel,
          };
        }));
      }

      const now = new Date();
      const dayOfWeek = now.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + mondayOffset);

      const weekDayLabels = ['Hen', 'Mar', 'Mer', 'Enj', 'Pre'];
      const weekDays: WeekDay[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const rec = attRecords.find(r => r.date === dateStr);
        weekDays.push({ day: weekDayLabels[i], status: (rec?.status as AttStatus) || 'prezent' });
      }
      setWeekAttendance(weekDays);

      if (annRes.data) {
        setAnnouncements(annRes.data.map(a => ({
          title: a.title, content: a.content, important: a.is_important,
        })));
      }
    } catch (error) {
      console.error('Error loading child data:', error);
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paneli Kryesor</h1>
          <p className="text-slate-500 mt-1">Ndiqni ecurine e femijes tuaj</p>
        </div>
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka femije te lidhur</h3>
          <p className="text-slate-500 text-sm">Kontaktoni drejtorine per te lidhur llogarine me femijen tuaj.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paneli Kryesor</h1>
          <p className="text-slate-500 mt-1">Ndiqni ecurine e femijes tuaj</p>
        </div>
        {children.length > 1 && (
          <div className="relative">
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-500 outline-none bg-white cursor-pointer"
            >
              {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {dataLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold">
                {childName.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{childName}</h2>
                <p className="text-slate-300">{className || 'Pa klase'} - Viti Akademik 2025-2026</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{overallAvg}</p>
                <p className="text-xs text-slate-300">Mesatarja</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Mesatarja" value={overallAvg} icon={Award} color="slate" />
            <StatCard label="Nota kete muaj" value={monthGrades} icon={TrendingUp} color="blue" />
            <StatCard label="Mungesa" value={absences} icon={Calendar} color="rose" />
            <StatCard label="Lende" value={subjectCount} icon={BookOpen} color="teal" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-900">Notat e Fundit</h3>
                </div>
                <Link to="/prind/nota" className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
                  Te gjitha <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {recentGrades.length > 0 ? (
                <div className="space-y-3">
                  {recentGrades.map((g, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${getGradeBgColor(g.grade)}`}>
                        {g.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{g.subject}</p>
                        <p className="text-xs text-slate-500">{g.type}</p>
                      </div>
                      <p className="text-xs text-slate-400">{g.date}</p>
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

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-slate-900">Frekuentimi i Javes</h3>
                  </div>
                  <Link to="/prind/frekuentimi" className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
                    Detaje <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  {weekAttendance.map((day) => {
                    const cfg = STATUS_CONFIG[day.status];
                    return (
                      <div key={day.day} className={`flex-1 ${cfg.bg} rounded-xl p-3 text-center`}>
                        <cfg.icon className={`w-5 h-5 ${cfg.color} mx-auto`} />
                        <p className="text-xs text-slate-600 mt-1 font-medium">{day.day}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <h3 className="font-semibold text-slate-900">Njoftime</h3>
                </div>
                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((ann, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${ann.important ? 'border-amber-200 bg-amber-50' : 'border-slate-100'}`}>
                        <p className="text-sm font-medium text-slate-900">{ann.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">Nuk ka njoftime</p>
                )}
              </div>
            </div>
          </div>

          {subjectAverages.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-500" />
                  <h3 className="font-semibold text-slate-900">Mesatarja sipas Lendes</h3>
                </div>
                <div className="text-sm text-slate-500">
                  Mesatarja: <span className="font-bold text-slate-900">{overallAvg}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Veprime të Shpejta</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { to: '/prind/nota', icon: <Award className="w-4 h-4" />, label: 'Notat e Fëmijës', desc: 'Shiko notat sipas lëndës', color: 'bg-blue-50 text-blue-600' },
                { to: '/prind/frekuentimi', icon: <Calendar className="w-4 h-4" />, label: 'Frekuentimi', desc: 'Mungesa dhe prezenca', color: 'bg-emerald-50 text-emerald-600' },
                { to: '/prind/mesazhet', icon: <MessageSquare className="w-4 h-4" />, label: 'Kontakto Mësuesin', desc: 'Dërgo mesazh direkt', color: 'bg-teal-50 text-teal-600' },
                { to: '/prind/mesazhet', icon: <Megaphone className="w-4 h-4" />, label: 'Mesazhe nga Shkolla', desc: 'Lexo njoftimet e reja', color: 'bg-amber-50 text-amber-600' },
              ].map(item => (
                <Link key={item.label} to={item.to} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group border border-slate-50 hover:border-slate-200">
                  <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
