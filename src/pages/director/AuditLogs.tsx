import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Activity, Search, Filter } from 'lucide-react';
import { ROLE_LABELS, type AuditLog, type AuditActionType, type UserRole } from '../../types/database';

interface LogRow extends AuditLog {
  actor_name?: string;
  target_name?: string;
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  view: 'Shikim',
  create: 'Krijim',
  update: 'Përditësim',
  delete: 'Fshirje',
  export: 'Eksport',
  login: 'Hyrje',
  logout: 'Dalje',
  password_change: 'Ndryshim fjalëkalimi',
};

const ACTION_COLORS: Record<AuditActionType, string> = {
  view: 'bg-slate-100 text-slate-700',
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-rose-100 text-rose-700',
  export: 'bg-purple-100 text-purple-700',
  login: 'bg-cyan-100 text-cyan-700',
  logout: 'bg-slate-100 text-slate-500',
  password_change: 'bg-amber-100 text-amber-700',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<AuditActionType | ''>('');
  const [filterResource, setFilterResource] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    const items: AuditLog[] = data || [];
    if (items.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }
    const userIds = new Set<string>();
    items.forEach((l) => {
      if (l.actor_id) userIds.add(l.actor_id);
      if (l.target_user_id) userIds.add(l.target_user_id);
    });
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(userIds));
    const nameMap = new Map((profilesData || []).map((p) => [p.id, p.full_name]));
    const enriched: LogRow[] = items.map((l) => ({
      ...l,
      actor_name: (l.actor_id && nameMap.get(l.actor_id)) || '—',
      target_name: (l.target_user_id && nameMap.get(l.target_user_id)) || '',
    }));
    setLogs(enriched);
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (filterResource && l.resource_type !== filterResource) return false;
    if (search) {
      const term = search.toLowerCase();
      if (!l.actor_name?.toLowerCase().includes(term) && !l.target_name?.toLowerCase().includes(term)) return false;
    }
    return true;
  });

  const resourceTypes = Array.from(new Set(logs.map((l) => l.resource_type))).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-500 text-sm">Regjistri i qasjes në të dhënat e ndjeshme (Ligji 06/L-082)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko sipas emrit..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value as AuditActionType | '')}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Të gjitha veprimet</option>
          {(Object.keys(ACTION_LABELS) as AuditActionType[]).map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
        <select
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Të gjitha burimet</option>
          {resourceTypes.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            {logs.length === 0 ? 'Asnjë veprim i regjistruar ende.' : 'Asnjë rezultat me filtrat e zgjedhur.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-3">Data & Ora</th>
                  <th className="px-4 py-3">Veprues</th>
                  <th className="px-4 py-3">Roli</th>
                  <th className="px-4 py-3">Veprimi</th>
                  <th className="px-4 py-3">Burimi</th>
                  <th className="px-4 py-3">Cak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap font-mono text-xs">
                      {new Date(l.created_at).toLocaleString('sq')}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{l.actor_name}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {l.actor_role ? ROLE_LABELS[l.actor_role as UserRole] || l.actor_role : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[l.action]}`}>
                        {ACTION_LABELS[l.action]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{l.resource_type}</td>
                    <td className="px-4 py-2 text-slate-600">{l.target_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length >= 500 && (
          <div className="px-4 py-2 text-xs text-slate-500 text-center border-t border-slate-100">
            Po shfaqen 500 regjistrimet më të fundit. Përdorni filtrat për të kërkuar konkretisht.
          </div>
        )}
      </div>
    </div>
  );
}
