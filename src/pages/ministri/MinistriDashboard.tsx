import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Crown, Building2, Users, GraduationCap, School, BookOpen, Award, MapPin, TrendingUp, ArrowRight, UserCog, ChevronRight, AlertCircle } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeleton';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface NationalStats {
  totalMunicipalities: number;
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalDirectors: number;
  totalDKAs: number;
  licensedTeachers: number;
  totalGrades: number;
  totalAttendance: number;
}

interface MunicipalitySummary {
  id: string;
  name: string;
  region: string;
  schools_count: number;
  students_count: number;
  teachers_count: number;
}

export default function MinistriDashboard() {
  const { isDemo } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [municipalities, setMunicipalities] = useState<MunicipalitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    if (isDemo) {
      // Demo data — kombëtare
      setStats({
        totalMunicipalities: 38,
        totalSchools: 1247,
        totalStudents: 287563,
        totalTeachers: 19842,
        totalParents: 248917,
        totalDirectors: 1247,
        totalDKAs: 38,
        licensedTeachers: 16234,
        totalGrades: 4582940,
        totalAttendance: 12847693,
      });
      setMunicipalities([
        { id: 'd1', name: 'Prishtinë', region: 'Qendër', schools_count: 142, students_count: 38271, teachers_count: 2654 },
        { id: 'd2', name: 'Prizren', region: 'Jug', schools_count: 98, students_count: 27843, teachers_count: 1892 },
        { id: 'd3', name: 'Pejë', region: 'Perëndim', schools_count: 76, students_count: 18420, teachers_count: 1342 },
        { id: 'd4', name: 'Mitrovicë', region: 'Veri', schools_count: 64, students_count: 15276, teachers_count: 1108 },
        { id: 'd5', name: 'Gjakovë', region: 'Perëndim', schools_count: 58, students_count: 13892, teachers_count: 987 },
        { id: 'd6', name: 'Ferizaj', region: 'Lindje', schools_count: 71, students_count: 16438, teachers_count: 1184 },
        { id: 'd7', name: 'Gjilan', region: 'Lindje', schools_count: 54, students_count: 12476, teachers_count: 902 },
        { id: 'd8', name: 'Podujevë', region: 'Qendër', schools_count: 48, students_count: 11254, teachers_count: 821 },
      ]);
      setLoading(false);
      return;
    }

    const [muns, schools, students, teachers, parents, directors, dkas, licensed, grades, attendance] = await Promise.all([
      supabase.from('municipalities').select('id, name, region'),
      supabase.from('school_info').select('id, municipality_id'),
      supabase.from('profiles').select('id, school_id').eq('role', 'nxenes').is('deleted_at', null),
      supabase.from('profiles').select('id, school_id').eq('role', 'mesues').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'prind').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'drejtor').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'drejtor_komunal').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'mesues').not('license_number', 'is', null),
      supabase.from('grades').select('id', { count: 'exact', head: true }),
      supabase.from('attendance').select('id', { count: 'exact', head: true }),
    ]);

    const firstError = [muns, schools, students, teachers, parents, directors, dkas, licensed, grades, attendance].find(r => r.error)?.error;
    if (firstError) {
      console.error('MinistriDashboard load error:', firstError);
      setLoadError('Disa statistika nuk u ngarkuan. ' + firstError.message);
    }

    const munList = muns.data || [];
    const schoolList = schools.data || [];
    const studentList = students.data || [];
    const teacherList = teachers.data || [];

    // Build school_id -> municipality_id map
    const schoolToMun = new Map<string, string>();
    schoolList.forEach((s) => { if (s.municipality_id) schoolToMun.set(s.id, s.municipality_id); });

    // Aggregate by municipality
    const munCounts = new Map<string, { schools: number; students: number; teachers: number }>();
    schoolList.forEach((s) => {
      if (!s.municipality_id) return;
      const c = munCounts.get(s.municipality_id) || { schools: 0, students: 0, teachers: 0 };
      c.schools++;
      munCounts.set(s.municipality_id, c);
    });
    studentList.forEach((st) => {
      const m = st.school_id ? schoolToMun.get(st.school_id) : null;
      if (!m) return;
      const c = munCounts.get(m) || { schools: 0, students: 0, teachers: 0 };
      c.students++;
      munCounts.set(m, c);
    });
    teacherList.forEach((t) => {
      const m = t.school_id ? schoolToMun.get(t.school_id) : null;
      if (!m) return;
      const c = munCounts.get(m) || { schools: 0, students: 0, teachers: 0 };
      c.teachers++;
      munCounts.set(m, c);
    });

    const munSummaries: MunicipalitySummary[] = munList.map((m) => {
      const c = munCounts.get(m.id) || { schools: 0, students: 0, teachers: 0 };
      return {
        id: m.id,
        name: m.name,
        region: m.region,
        schools_count: c.schools,
        students_count: c.students,
        teachers_count: c.teachers,
      };
    }).sort((a, b) => b.schools_count - a.schools_count);

    setMunicipalities(munSummaries);
    setStats({
      totalMunicipalities: munList.length,
      totalSchools: schoolList.length,
      totalStudents: studentList.length,
      totalTeachers: teacherList.length,
      totalParents: parents.count || 0,
      totalDirectors: directors.count || 0,
      totalDKAs: dkas.count || 0,
      licensedTeachers: licensed.count || 0,
      totalGrades: grades.count || 0,
      totalAttendance: attendance.count || 0,
    });
    setLoading(false);
  };

  if (loading || !stats) {
    return <DashboardSkeleton />;
  }

  const licensePercentage = stats.totalTeachers > 0 ? Math.round((stats.licensedTeachers / stats.totalTeachers) * 100) : 0;

  return (
    <div className="space-y-6">
      {loadError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">Të dhëna të paplota</p>
            <p className="text-xs text-amber-700 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}
      <div className="bg-gradient-to-r from-purple-700 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Paneli i Ministrit të Arsimit</h1>
              <p className="text-purple-100 text-sm">MAShTI — Statistika kombëtare të arsimit parauniversitar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/ministri/stafi"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium"
            >
              <UserCog className="w-4 h-4" />
              Stafi
            </Link>
            <Link
              to="/ministri/komunat"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Komunat
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Building2} label={t('stat.municipalities')} value={stats.totalMunicipalities} color="purple" />
        <StatCard icon={School} label={t('stat.schools')} value={stats.totalSchools} color="blue" />
        <StatCard icon={Users} label={t('stat.students')} value={stats.totalStudents} color="cyan" />
        <StatCard icon={GraduationCap} label={t('stat.teachers')} value={stats.totalTeachers} color="teal" />
        <StatCard icon={Award} label={t('stat.licensed')} value={`${licensePercentage}%`} subtitle={`${stats.licensedTeachers}/${stats.totalTeachers}`} color="emerald" />
        <StatCard icon={Users} label={t('stat.parents')} value={stats.totalParents} color="slate" />
        <StatCard icon={Crown} label={t('stat.dka_directors')} value={stats.totalDKAs} color="amber" />
        <StatCard icon={Crown} label={t('stat.directors')} value={stats.totalDirectors} color="indigo" />
        <StatCard icon={BookOpen} label="Nota të regjistruara" value={stats.totalGrades.toLocaleString()} color="rose" />
        <StatCard icon={MapPin} label="Regjistrime frekuentimi" value={stats.totalAttendance.toLocaleString()} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-slate-900">Nxënësit sipas komunave (Top 8)</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={municipalities.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="students_count" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Nxënës" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <School className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Shkollat sipas rajonit</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={(() => {
                  const byRegion = new Map<string, number>();
                  municipalities.forEach((m) => byRegion.set(m.region, (byRegion.get(m.region) || 0) + m.schools_count));
                  return Array.from(byRegion.entries()).map(([name, value]) => ({ name, value }));
                })()}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: { name?: string; value?: number }) => `${entry.name ?? ''}: ${entry.value ?? 0}`}
              >
                {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Mësues vs Nxënës (Top 8)</h2>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={municipalities.slice(0, 8)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="teachers_count" fill="#10b981" name="Mësues" radius={[6, 6, 0, 0]} />
            <Bar dataKey="schools_count" fill="#3b82f6" name="Shkolla" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-slate-900">Komunat sipas aktivitetit</h2>
          </div>
          <Link to="/ministri/komunat" className="inline-flex items-center gap-1 text-sm text-purple-700 hover:text-purple-900 font-medium">
            Shiko të gjitha
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
              <th className="px-4 py-2">Komuna</th>
              <th className="px-4 py-2">Rajoni</th>
              <th className="px-4 py-2 text-center">Shkolla</th>
              <th className="px-4 py-2 text-center">Nxënës</th>
              <th className="px-4 py-2 text-center">Mësues</th>
              <th className="px-4 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {municipalities.map((m) => (
              <tr
                key={m.id}
                onClick={() => navigate(`/ministri/shkollat?municipality=${m.id}`)}
                className="hover:bg-purple-50/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2 font-medium text-slate-900">{m.name}</td>
                <td className="px-4 py-2 text-slate-600">{m.region}</td>
                <td className="px-4 py-2 text-center">{m.schools_count}</td>
                <td className="px-4 py-2 text-center">{m.students_count}</td>
                <td className="px-4 py-2 text-center">{m.teachers_count}</td>
                <td className="px-4 py-2 text-right text-slate-300">
                  <ChevronRight className="w-4 h-4 inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, color }: { icon: typeof Crown; label: string; value: number | string; subtitle?: string; color: string }) {
  const bg = `bg-${color}-100`;
  const text = `text-${color}-700`;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
