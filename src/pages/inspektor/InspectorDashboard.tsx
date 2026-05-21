import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardCheck, School, AlertTriangle, CheckCircle, Clock, FileText, ChevronRight, MessageSquare, MapPin } from 'lucide-react';
import { DashboardSkeleton } from '../../components/Skeleton';
import { formatDate } from '../../lib/formatDate';
import { useI18n } from '../../lib/i18n/I18nProvider';
import type { TranslationKey } from '../../lib/i18n/translations';

interface Stats {
  totalInspections: number;
  pendingInspections: number;
  completedInspections: number;
  openFindings: number;
  schools: number;
  thisMonthInspections: number;
}

interface RecentInspection {
  id: string;
  school_name: string;
  inspection_date: string;
  status: string;
  finding_count: number;
}

const STATUS_KEYS: Record<string, { labelKey: TranslationKey; color: string }> = {
  scheduled: { labelKey: 'inspector.status_scheduled', color: 'bg-blue-100 text-blue-700' },
  in_progress: { labelKey: 'inspector.status_in_progress', color: 'bg-amber-100 text-amber-700' },
  completed: { labelKey: 'inspector.status_completed', color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { labelKey: 'inspector.status_cancelled', color: 'bg-slate-100 text-slate-600' },
};

export default function InspectorDashboard() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentInspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (isDemo) {
      setStats({
        totalInspections: 47,
        pendingInspections: 8,
        completedInspections: 39,
        openFindings: 12,
        schools: 28,
        thisMonthInspections: 6,
      });
      setRecent([
        { id: 'd1', school_name: 'SHFMU "Naim Frashëri" - Prishtinë', inspection_date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'completed', finding_count: 3 },
        { id: 'd2', school_name: 'SHFMU "Hasan Prishtina" - Prishtinë', inspection_date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'in_progress', finding_count: 1 },
        { id: 'd3', school_name: 'SHFMU "Faik Konica" - Prishtinë', inspection_date: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'scheduled', finding_count: 0 },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, inspection_date, status, school_id, school_info(name, full_name)')
        .eq('inspector_id', profile?.id)
        .order('inspection_date', { ascending: false });

      const items = inspections || [];
      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: findings } = await supabase
        .from('inspection_findings')
        .select('id, inspection_id, resolved')
        .in('inspection_id', items.map((i) => i.id));

      const openCount = (findings || []).filter((f) => !f.resolved).length;
      const findingsByInspection = new Map<string, number>();
      (findings || []).forEach((f) => {
        findingsByInspection.set(f.inspection_id, (findingsByInspection.get(f.inspection_id) || 0) + 1);
      });

      const schoolIds = new Set(items.map((i) => i.school_id).filter(Boolean));

      setStats({
        totalInspections: items.length,
        pendingInspections: items.filter((i) => i.status === 'scheduled' || i.status === 'in_progress').length,
        completedInspections: items.filter((i) => i.status === 'completed').length,
        openFindings: openCount,
        schools: schoolIds.size,
        thisMonthInspections: items.filter((i) => i.inspection_date >= monthAgo).length,
      });

      type InspRow = { id: string; school_id: string; inspection_date: string; status: string; school_info: { name?: string; full_name?: string } | { name?: string; full_name?: string }[] | null };
      setRecent((items as InspRow[]).slice(0, 5).map((i) => {
        const school = Array.isArray(i.school_info) ? i.school_info[0] : i.school_info;
        return {
          id: i.id,
          school_name: school?.full_name || school?.name || '—',
          inspection_date: i.inspection_date,
          status: i.status,
          finding_count: findingsByInspection.get(i.id) || 0,
        };
      }));
    } catch (err) {
      console.error('InspectorDashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-rose-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">{t('inspector.title')}</h1>
              <p className="text-orange-100 text-sm">{t('inspector.welcome')}, {profile?.full_name}</p>
            </div>
          </div>
          <Link
            to="/inspektor/inspektimet"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('inspector.new_inspection')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={ClipboardCheck} label={t('inspector.stat_total')} value={stats?.totalInspections || 0} color="orange" />
        <StatCard icon={Clock} label={t('inspector.stat_pending')} value={stats?.pendingInspections || 0} color="amber" />
        <StatCard icon={CheckCircle} label={t('inspector.stat_completed')} value={stats?.completedInspections || 0} color="emerald" />
        <StatCard icon={AlertTriangle} label={t('inspector.stat_findings')} value={stats?.openFindings || 0} color="rose" />
        <StatCard icon={School} label={t('inspector.stat_schools')} value={stats?.schools || 0} color="blue" />
        <StatCard icon={Clock} label={t('inspector.stat_month')} value={stats?.thisMonthInspections || 0} color="cyan" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            {t('inspector.recent_inspections')}
          </h2>
          <Link to="/inspektor/inspektimet" className="inline-flex items-center gap-1 text-sm text-orange-700 hover:text-orange-900 font-medium">
            {t('btn.view_all')}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            {t('inspector.no_inspections')}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((r) => {
              const st = STATUS_KEYS[r.status];
              const statusLabel = st ? t(st.labelKey) : r.status;
              const statusColor = st?.color || 'bg-slate-100 text-slate-600';
              return (
                <Link
                  key={r.id}
                  to={`/inspektor/inspektimet/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <School className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{r.school_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColor}`}>{statusLabel}</span>
                      <span className="text-xs text-slate-500">{formatDate(r.inspection_date)}</span>
                      {r.finding_count > 0 && (
                        <span className="text-xs text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {r.finding_count} {t('inspector.findings_label')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Link to="/inspektor/inspektimet" className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg hover:border-orange-200 transition-all group">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition-colors">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="font-semibold text-slate-900">{t('inspector.all_inspections')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('inspector.all_inspections_desc')}</p>
        </Link>
        <Link to="/inspektor/shkollat" className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg hover:border-blue-200 transition-all group">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">{t('inspector.kosovo_schools')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('inspector.kosovo_schools_desc')}</p>
        </Link>
        <Link to="/inspektor/mesazhet" className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg hover:border-teal-200 transition-all group">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-teal-200 transition-colors">
            <MessageSquare className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="font-semibold text-slate-900">{t('header.messages')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('inspector.messages_desc')}</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof ClipboardCheck; label: string; value: number | string; color: string }) {
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

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
