import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import type { Municipality } from '../../types/database';

const REGION_COLORS: Record<string, string> = {
  'Qendër': 'bg-blue-100 text-blue-700',
  'Jug': 'bg-amber-100 text-amber-700',
  'Veri': 'bg-cyan-100 text-cyan-700',
  'Lindje': 'bg-emerald-100 text-emerald-700',
  'Perëndim': 'bg-purple-100 text-purple-700',
};

export default function Municipalities() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase.from('municipalities').select('*').order('region').order('name');
    setMunicipalities(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const byRegion = new Map<string, Municipality[]>();
  municipalities.forEach((m) => {
    const r = m.region || 'Pa rajon';
    const list = byRegion.get(r) || [];
    list.push(m);
    byRegion.set(r, list);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Komunat e Kosovës</h1>
          <p className="text-slate-500 text-sm">38 komunat — Ligji 03/L-068 për Arsimin në Komunat</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-900">
          Komunat janë përgjegjëse për arsimin parauniversitar në Kosovë. Çdo shkollë i përket
          një komune dhe komuna është përgjegjëse për menaxhimin operativ.
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(byRegion.entries()).map(([region, mun]) => (
          <div key={region} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${REGION_COLORS[region] || 'bg-slate-100 text-slate-700'}`}>
                  Rajoni
                </span>
                {region}
                <span className="text-xs text-slate-500 ml-auto">{mun.length} komuna</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-100">
              {mun.map((m) => (
                <div key={m.id} className="px-5 py-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{m.name}</span>
                  {m.code && <span className="text-xs text-slate-500 font-mono ml-auto">{m.code}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
