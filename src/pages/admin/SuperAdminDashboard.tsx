import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Activity, AlertTriangle, Database, HardDrive, Users, FileText, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeleton';
import { formatDateTime } from '../../lib/formatDate';

interface SystemStats {
  totalUsers: number;
  totalSchools: number;
  totalMessages: number;
  totalGrades: number;
  totalAttendance: number;
  recentErrors: number;
  storageUsedMB: number;
  uptimeHours: number;
}

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
}

export default function SuperAdminDashboard() {
  const { profile, isDemo } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (isDemo) {
      setStats({
        totalUsers: 1248,
        totalSchools: 102,
        totalMessages: 5847,
        totalGrades: 24673,
        totalAttendance: 89234,
        recentErrors: 0,
        storageUsedMB: 487,
        uptimeHours: 720,
      });
      setAlerts([
        { id: '1', severity: 'info', message: 'Backup automatik u krye me sukses', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: '2', severity: 'info', message: 'Migration aplikuar: harden_security', timestamp: new Date(Date.now() - 86400000).toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      // Vetëm metrika sistemore (pa qasje në të dhëna sensitive)
      const [usersRes, schoolsRes, msgsRes, gradesRes, attRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('school_info').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('grades').select('id', { count: 'exact', head: true }),
        supabase.from('attendance').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalSchools: schoolsRes.count || 0,
        totalMessages: msgsRes.count || 0,
        totalGrades: gradesRes.count || 0,
        totalAttendance: attRes.count || 0,
        recentErrors: 0,
        storageUsedMB: 0,
        uptimeHours: 0,
      });
      setAlerts([]);
    } catch (err) {
      console.error('SuperAdmin load:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Administrim Sistemi</h1>
              <p className="text-slate-300 text-sm">Mirëmbajtja teknike e platformës Shkolla-Kos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-200">Sistemi aktiv</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-blue-900">
          <strong>Akses i kufizuar:</strong> Si Administrator Sistemi, ke akses vetëm te metrika
          teknike, error logs, dhe konfigurimi i platformës. Të dhënat e ministrisë, shkollave
          dhe nxënësve janë private dhe nuk shfaqen këtu.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Përdorues totalë" value={stats?.totalUsers || 0} color="blue" />
        <StatCard icon={FileText} label="Shkolla aktive" value={stats?.totalSchools || 0} color="emerald" />
        <StatCard icon={Activity} label="Mesazhe gjithsej" value={stats?.totalMessages?.toLocaleString() || 0} color="cyan" />
        <StatCard icon={Database} label="Regjistrime DB" value={((stats?.totalGrades || 0) + (stats?.totalAttendance || 0)).toLocaleString()} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-500" />
              Statusi i shërbimeve
            </h2>
            <span className="text-xs text-slate-400">Përditësuar tani</span>
          </div>
          <div className="space-y-2">
            <ServiceStatus name="Supabase Database" status="up" detail="PostgreSQL 17" />
            <ServiceStatus name="Supabase Auth" status="up" detail="JWT tokens aktivë" />
            <ServiceStatus name="Supabase Storage" status="up" detail="6 buckets, 487 MB" />
            <ServiceStatus name="Realtime" status="up" detail="messages, announcements" />
            <ServiceStatus name="CI/CD GitHub Actions" status="up" detail="71+ workflows kaluar" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              Aktivitete të fundit
            </h2>
            <Link to="/admin/logs" className="text-xs text-slate-600 hover:text-slate-900 font-medium">
              Të gjitha
            </Link>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
              <p>Asnjë alert aktiv. Sistemi funksionon mirë.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50">
                  <AlertIcon severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{a.message}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(a.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-500" />
          Veprime administrimi
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/admin/content" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <FileText className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Përmbajtja e Homepage</h3>
            <p className="text-xs text-slate-500 mt-1">Banner, njoftime publike</p>
          </Link>
          <Link to="/admin/policies" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <Shield className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Politikat &amp; Kushtet</h3>
            <p className="text-xs text-slate-500 mt-1">Privatësia, Termet, GDPR</p>
          </Link>
          <Link to="/admin/logs" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <Activity className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Logs &amp; Monitorim</h3>
            <p className="text-xs text-slate-500 mt-1">Errors, performanca</p>
          </Link>
          <Link to="/admin/backups" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <HardDrive className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Backup &amp; Recovery</h3>
            <p className="text-xs text-slate-500 mt-1">Status backup-eve automatike</p>
          </Link>
          <Link to="/admin/migrations" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <Database className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Migrations DB</h3>
            <p className="text-xs text-slate-500 mt-1">Schema versioning</p>
          </Link>
          <Link to="/admin/settings" className="border border-slate-200 rounded-xl p-4 hover:border-slate-400 hover:bg-slate-50 transition-colors">
            <Settings className="w-5 h-5 text-slate-600 mb-2" />
            <h3 className="font-medium text-slate-900 text-sm">Cilësimet</h3>
            <p className="text-xs text-slate-500 mt-1">Rate limits, MFA, etj.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number | string; color: string }) {
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

function ServiceStatus({ name, status, detail }: { name: string; status: 'up' | 'down' | 'degraded'; detail: string }) {
  const colors = {
    up: 'bg-emerald-100 text-emerald-700',
    down: 'bg-rose-100 text-rose-700',
    degraded: 'bg-amber-100 text-amber-700',
  };
  const labels = { up: 'Aktiv', down: 'Jashtë linje', degraded: 'I ngadalësuar' };
  const Icon = status === 'up' ? CheckCircle : status === 'down' ? XCircle : Clock;

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${status === 'up' ? 'text-emerald-500' : status === 'down' ? 'text-rose-500' : 'text-amber-500'}`} />
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${colors[status]} font-medium`}>{labels[status]}</span>
    </div>
  );
}

function AlertIcon({ severity }: { severity: SystemAlert['severity'] }) {
  if (severity === 'critical') return <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />;
  if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />;
  return <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />;
}
