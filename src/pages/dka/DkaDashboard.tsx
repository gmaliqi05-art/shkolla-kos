import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Building, School, Users, GraduationCap, MapPin } from 'lucide-react';

interface DkaStats {
  municipalityName: string;
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalDirectors: number;
}

interface SchoolRow {
  id: string;
  name: string;
  director_name: string;
  locality_name?: string;
  students_count: number;
  teachers_count: number;
}

export default function DkaDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DkaStats | null>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile?.managed_municipality_id) {
      setLoading(false);
      return;
    }

    const munRes = await supabase.from('municipalities').select('name').eq('id', profile.managed_municipality_id).maybeSingle();
    const schoolsRes = await supabase.from('school_info').select('*').eq('municipality_id', profile.managed_municipality_id);
    const schoolList: { id: string; name: string; director_name: string; locality_id: string | null }[] = schoolsRes.data || [];
    const schoolIds = schoolList.map((s) => s.id);

    const studentsRes = await supabase.from('profiles').select('id, school_id').eq('role', 'nxenes').is('deleted_at', null).in('school_id', schoolIds.length > 0 ? schoolIds : ['00000000-0000-0000-0000-000000000000']);
    const teachersRes = await supabase.from('profiles').select('id, school_id').eq('role', 'mesues').is('deleted_at', null).in('school_id', schoolIds.length > 0 ? schoolIds : ['00000000-0000-0000-0000-000000000000']);
    const directorsRes = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'drejtor').is('deleted_at', null).in('school_id', schoolIds.length > 0 ? schoolIds : ['00000000-0000-0000-0000-000000000000']);

    const studentsBySchool = new Map<string, number>();
    (studentsRes.data || []).forEach((s) => { if (s.school_id) studentsBySchool.set(s.school_id, (studentsBySchool.get(s.school_id) || 0) + 1); });
    const teachersBySchool = new Map<string, number>();
    (teachersRes.data || []).forEach((t) => { if (t.school_id) teachersBySchool.set(t.school_id, (teachersBySchool.get(t.school_id) || 0) + 1); });

    // Load locality names
    const localityIds = schoolList.map((s) => s.locality_id).filter((l): l is string => !!l);
    const localitiesRes = localityIds.length > 0
      ? await supabase.from('localities').select('id, name').in('id', localityIds)
      : { data: [] };
    const locMap = new Map((localitiesRes.data || []).map((l) => [l.id, l.name]));

    setSchools(schoolList.map((s) => ({
      id: s.id,
      name: s.name,
      director_name: s.director_name || '—',
      locality_name: s.locality_id ? locMap.get(s.locality_id) : undefined,
      students_count: studentsBySchool.get(s.id) || 0,
      teachers_count: teachersBySchool.get(s.id) || 0,
    })));

    setStats({
      municipalityName: munRes.data?.name || 'Komuna',
      totalSchools: schoolList.length,
      totalStudents: (studentsRes.data || []).length,
      totalTeachers: (teachersRes.data || []).length,
      totalDirectors: directorsRes.count || 0,
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;
  }

  if (!profile?.managed_municipality_id) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <p className="text-amber-900 font-medium">Nuk është caktuar komuna.</p>
        <p className="text-amber-700 text-sm mt-2">Ministri (MAShTI) duhet të caktojë komunën që menaxhoni.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-700 to-orange-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Building className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Drejtoria Komunale e Arsimit</h1>
            <p className="text-amber-100 text-sm">Komuna {stats?.municipalityName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={School} label="Shkolla" value={stats?.totalSchools || 0} color="amber" />
        <StatCard icon={Users} label="Nxënës" value={stats?.totalStudents || 0} color="cyan" />
        <StatCard icon={GraduationCap} label="Mësues" value={stats?.totalTeachers || 0} color="teal" />
        <StatCard icon={Building} label="Drejtorë shkollash" value={stats?.totalDirectors || 0} color="blue" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Shkollat e komunës</h2>
        </div>
        {schools.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">Asnjë shkollë e regjistruar në këtë komunë.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-2">Shkolla</th>
                <th className="px-4 py-2">Fshati / Qyteti</th>
                <th className="px-4 py-2">Drejtori</th>
                <th className="px-4 py-2 text-center">Nxënës</th>
                <th className="px-4 py-2 text-center">Mësues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {s.locality_name ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {s.locality_name}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{s.director_name}</td>
                  <td className="px-4 py-2 text-center">{s.students_count}</td>
                  <td className="px-4 py-2 text-center">{s.teachers_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Building; label: string; value: number | string; color: string }) {
  const bg = `bg-${color}-100`;
  const text = `text-${color}-700`;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2`}>
        <Icon className={`w-5 h-5 ${text}`} />
      </div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
