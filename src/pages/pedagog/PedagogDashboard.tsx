import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Users, Stethoscope, FolderOpen, Briefcase, Trophy, MessageSquare, ChevronRight, AlertCircle, Target, Sparkles } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeleton';

interface Stats {
  studentsWithNeeds: number;
  activeIeps: number;
  diagnosticAssessments: number;
  portfolios: number;
  councilsActive: number;
  upcomingMeetings: number;
}

export default function PedagogDashboard() {
  const { profile, isDemo } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (isDemo) {
      setStats({
        studentsWithNeeds: 12,
        activeIeps: 8,
        diagnosticAssessments: 24,
        portfolios: 67,
        councilsActive: 3,
        upcomingMeetings: 2,
      });
      setLoading(false);
      return;
    }

    const schoolFilter = profile?.school_id;

    try {
      const [needsRes, iepsRes, diagsRes, portfoliosRes, councilsRes, meetingsRes] = await Promise.all([
        supabase.from('special_needs').select('id', { count: 'exact', head: true }),
        supabase.from('individual_education_plans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('diagnostic_assessments').select('id', { count: 'exact', head: true }),
        supabase.from('student_portfolios').select('id', { count: 'exact', head: true }),
        supabase.from('school_councils').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('school_id', schoolFilter || ''),
        supabase.from('parent_meetings').select('id', { count: 'exact', head: true }).gte('meeting_date', new Date().toISOString()),
      ]);

      setStats({
        studentsWithNeeds: needsRes.count || 0,
        activeIeps: iepsRes.count || 0,
        diagnosticAssessments: diagsRes.count || 0,
        portfolios: portfoliosRes.count || 0,
        councilsActive: councilsRes.count || 0,
        upcomingMeetings: meetingsRes.count || 0,
      });
    } catch (err) {
      console.error('PedagogDashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Paneli i Pedagogut</h1>
              <p className="text-pink-100 text-sm">Mirë se erdhët, {profile?.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Heart} label="Nxënës me NVA" value={stats?.studentsWithNeeds || 0} color="pink" />
        <StatCard icon={Target} label="PIA aktive" value={stats?.activeIeps || 0} color="rose" />
        <StatCard icon={Stethoscope} label="Vlerësime" value={stats?.diagnosticAssessments || 0} color="purple" />
        <StatCard icon={FolderOpen} label="Portofole" value={stats?.portfolios || 0} color="amber" />
        <StatCard icon={Briefcase} label="Këshilla aktive" value={stats?.councilsActive || 0} color="blue" />
        <StatCard icon={Users} label="Takime së shpejti" value={stats?.upcomingMeetings || 0} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Action: NVA & PIA */}
        <Link to="/pedagog/nva" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-pink-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center group-hover:bg-pink-200 transition-colors">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-pink-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">NVA & PIA</h3>
          <p className="text-sm text-slate-500">Menaxho nevojat e veçanta arsimore dhe Planet Individuale</p>
        </Link>

        <Link to="/pedagog/diagnostik" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-purple-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Stethoscope className="w-6 h-6 text-purple-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Vlerësimi Diagnostikues</h3>
          <p className="text-sm text-slate-500">Vlerësime psikologjike dhe edukative të nxënësve</p>
        </Link>

        <Link to="/pedagog/portofoli" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-amber-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <FolderOpen className="w-6 h-6 text-amber-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Portofoli i Nxënësve</h3>
          <p className="text-sm text-slate-500">Mbikëqyrje e portofoleve dhe arritjeve</p>
        </Link>

        <Link to="/pedagog/keshillat" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Këshillat Shkollore</h3>
          <p className="text-sm text-slate-500">Anëtarësi në Këshillin Pedagogjik dhe të tjerë</p>
        </Link>

        <Link to="/pedagog/aktivitete" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
              <Trophy className="w-6 h-6 text-emerald-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Aktivitetet</h3>
          <p className="text-sm text-slate-500">Aktivitete jashtëshkollore dhe pjesëmarrës</p>
        </Link>

        <Link to="/pedagog/takimet" className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-lg hover:border-cyan-200 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-cyan-500 transition-colors" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Takimet me Prindër</h3>
          <p className="text-sm text-slate-500">Takime të planifikuara dhe procesverbalet</p>
        </Link>
      </div>

      {stats && stats.studentsWithNeeds > 0 && stats.activeIeps < stats.studentsWithNeeds && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {stats.studentsWithNeeds - stats.activeIeps} nxënës me NVA pa PIA aktiv
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Sipas Ligjit 04/L-032, çdo nxënës me NVA duhet të ketë një PIA të miratuar.
            </p>
          </div>
          <Link to="/pedagog/nva" className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 whitespace-nowrap">
            Shiko <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Komunikim me mësues</p>
            <p className="text-xs text-slate-500">Bashkëpunim me mësuesit për ndërhyrje të shpejtë</p>
          </div>
        </div>
        <Link to="/pedagog/mesazhet" className="inline-flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-sm font-medium">
          <MessageSquare className="w-4 h-4" />
          Mesazhet
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Heart; label: string; value: number | string; color: string }) {
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
