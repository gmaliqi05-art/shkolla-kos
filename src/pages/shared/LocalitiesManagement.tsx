import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { useI18n } from '../../lib/i18n/I18nProvider';
import {
  LOCALITY_TYPE_LABELS,
  type LocalityType,
  type Locality,
  type Municipality,
} from '../../types/database';
import { Loader2, Plus, X, MapPin, Edit2, Trash2, Building } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

interface LocalityRow extends Locality {
  municipality_name?: string;
}

export default function LocalitiesManagement() {
  const { profile } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const canManage = profile?.role === 'drejtor' || profile?.role === 'drejtor_komunal' || profile?.role === 'ministri';

  const [localities, setLocalities] = useState<LocalityRow[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMunicipality, setFilterMunicipality] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Locality | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    municipality_id: '',
    type: 'fshat' as LocalityType,
    is_city_center: false,
    postal_code: '',
  });

  useEffect(() => {
    load();
  }, [profile?.id]);

  const load = async () => {
    const [locRes, munRes] = await Promise.all([
      supabase.from('localities').select('*').order('name'),
      supabase.from('municipalities').select('*').order('name'),
    ]);
    const munList = munRes.data || [];
    const munMap = new Map(munList.map((m) => [m.id, m.name]));
    setLocalities((locRes.data || []).map((l) => ({
      ...l,
      municipality_name: munMap.get(l.municipality_id),
    })));
    setMunicipalities(munList);

    // Pre-fill municipality for DKA
    if (profile?.role === 'drejtor_komunal' && profile.managed_municipality_id) {
      setFilterMunicipality(profile.managed_municipality_id);
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      municipality_id: profile?.role === 'drejtor_komunal' && profile.managed_municipality_id
        ? profile.managed_municipality_id
        : '',
      type: 'fshat',
      is_city_center: false,
      postal_code: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (l: Locality) => {
    setEditing(l);
    setForm({
      name: l.name,
      municipality_id: l.municipality_id,
      type: l.type,
      is_city_center: l.is_city_center,
      postal_code: l.postal_code,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      name: form.name,
      municipality_id: form.municipality_id,
      type: form.type,
      is_city_center: form.is_city_center,
      postal_code: form.postal_code,
    };
    const res = editing
      ? await supabase.from('localities').update(payload).eq('id', editing.id)
      : await supabase.from('localities').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  const remove = async (l: Locality) => {
    if (!confirm(`Fshij vendbanimin "${l.name}"?`)) return;
    const { error } = await supabase.from('localities').delete().eq('id', l.id);
    if (error) toast.error('Gabim: ' + error.message);
    else { toast.success('Vendbanimi u fshi.'); load(); }
  };

  const filtered = localities.filter((l) => {
    if (filterMunicipality && l.municipality_id !== filterMunicipality) return false;
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by municipality
  const grouped = new Map<string, LocalityRow[]>();
  filtered.forEach((l) => {
    const key = l.municipality_name || 'Pa komunë';
    const list = grouped.get(key) || [];
    list.push(l);
    grouped.set(key, list);
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Qytetet, Fshatrat dhe Lagjet</h1>
            <p className="text-slate-500 text-sm">{localities.length} {t('locality.count_in_municipalities')}</p>
          </div>
        </div>
        {canManage && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            {t('locality.add')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko vendbanim..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
        />
        <div className="min-w-[220px]">
          <SearchableSelect
            value={filterMunicipality}
            onChange={setFilterMunicipality}
            disabled={profile?.role === 'drejtor_komunal'}
            placeholder="Të gjitha komunat"
            groupBy
            options={municipalities.map((m) => ({ value: m.id, label: m.name, group: m.region || 'Pa rajon' }))}
          />
        </div>
      </div>

      {grouped.size === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center">
          <Building className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">
            {(search || filterMunicipality) ? 'Asnjë vendbanim me filtrat e zgjedhur' : 'Asnjë vendbanim'}
          </p>
          <p className="text-slate-400 text-sm mb-4">
            {(search || filterMunicipality)
              ? 'Provoni të hiqni filtrat ose përdorni kërkim tjetër.'
              : canManage ? 'Shto vendbanimin e parë për të filluar.' : 'Lista është bosh aktualisht.'}
          </p>
          {(search || filterMunicipality) ? (
            <button
              onClick={() => { setSearch(''); setFilterMunicipality(''); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
            >
              {t('btn.clear_filters')}
            </button>
          ) : canManage && (
            <button
              onClick={openNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('locality.add')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([munName, locs]) => (
            <div key={munName} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900">{munName}</h3>
                <span className="text-xs text-slate-500 ml-auto">{locs.length} vendbanime</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-slate-100">
                {locs.map((l) => (
                  <div key={l.id} className="px-4 py-3 flex items-center gap-2 hover:bg-slate-50 group">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm flex items-center gap-1.5">
                        {l.name}
                        {l.is_city_center && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">qendër</span>}
                      </p>
                      <p className="text-xs text-slate-500">
                        {LOCALITY_TYPE_LABELS[l.type]}
                        {l.postal_code && ` · ${l.postal_code}`}
                      </p>
                    </div>
                    {canManage && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button onClick={() => openEdit(l)} className="p-1 text-slate-400 hover:text-slate-700">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(l)} className="p-1 text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? t('locality.edit') : t('locality.new')}</h2>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri *</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Komuna *</label>
                <SearchableSelect
                  required
                  disabled={profile?.role === 'drejtor_komunal'}
                  value={form.municipality_id}
                  onChange={(v) => setForm({ ...form, municipality_id: v })}
                  placeholder="Kërko ose zgjidh komunën"
                  groupBy
                  options={municipalities.map((m) => ({ value: m.id, label: m.name, group: m.region || 'Pa rajon' }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipi *</label>
                  <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LocalityType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
                    {(Object.keys(LOCALITY_TYPE_LABELS) as LocalityType[]).map((t) => (
                      <option key={t} value={t}>{LOCALITY_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kodi postar</label>
                  <input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_city_center} onChange={(e) => setForm({ ...form, is_city_center: e.target.checked })} className="rounded" />
                  <span className="text-sm text-slate-700">Qendër e komunës</span>
                </label>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">{t('btn.cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
