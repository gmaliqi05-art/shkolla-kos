import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { logAudit } from '../../lib/audit';
import { ShieldAlert, Plus, X, Loader2, Calendar, User, CheckCircle } from 'lucide-react';
import {
  BREACH_SEVERITY_LABELS, BREACH_STATUS_LABELS, BREACH_DATA_TYPE_LABELS,
  type DataBreach, type BreachSeverity, type BreachStatus,
} from '../../types/database';

const SEVERITY_STYLES: Record<BreachSeverity, string> = {
  lehte: 'bg-amber-100 text-amber-700',
  mesatare: 'bg-orange-100 text-orange-700',
  rende: 'bg-rose-100 text-rose-700',
};
const STATUS_STYLES: Record<BreachStatus, string> = {
  ne_vleresim: 'bg-blue-100 text-blue-700',
  raportuar: 'bg-violet-100 text-violet-700',
  zgjidhur: 'bg-emerald-100 text-emerald-700',
};
const DATA_TYPES = Object.keys(BREACH_DATA_TYPE_LABELS);

const emptyForm = {
  title: '',
  description: '',
  affected_data_types: [] as string[],
  num_subjects_affected: '',
  severity: 'mesatare' as BreachSeverity,
  discovered_at: new Date().toISOString().slice(0, 10),
};

export default function DataBreaches() {
  const { profile } = useAuth();
  const toast = useToast();
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<DataBreach | null>(null);

  useEffect(() => {
    load();
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_breaches')
        .select('*, reporter:reported_by(full_name)')
        .order('discovered_at', { ascending: false });
      if (error) throw error;
      type Row = DataBreach & { reporter?: { full_name: string } | null };
      setBreaches((data as Row[] | null || []).map((r) => ({ ...r, reporter_name: r.reporter?.full_name || '' })));
    } catch (err) {
      console.error('Error loading breaches:', err);
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (tp: string) => {
    setForm((f) => ({
      ...f,
      affected_data_types: f.affected_data_types.includes(tp)
        ? f.affected_data_types.filter((x) => x !== tp)
        : [...f.affected_data_types, tp],
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.title.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('data_breaches').insert({
        title: form.title,
        description: form.description,
        affected_data_types: form.affected_data_types,
        num_subjects_affected: form.num_subjects_affected ? Number(form.num_subjects_affected) : null,
        severity: form.severity,
        discovered_at: form.discovered_at,
        reported_by: profile.id,
      });
      if (error) throw error;
      await logAudit({ actorId: profile.id, actorRole: profile.role, action: 'create', resourceType: 'data_breach' });
      toast.success('Shkelja u regjistrua.');
      setShowForm(false);
      setForm({ ...emptyForm });
      load();
    } catch (err) {
      console.error('Error reporting breach:', err);
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    } finally {
      setSubmitting(false);
    }
  };

  const update = async () => {
    if (!selected) return;
    try {
      const { error } = await supabase
        .from('data_breaches')
        .update({
          status: selected.status,
          reported_to_aip: selected.reported_to_aip,
          aip_reported_at: selected.aip_reported_at,
          aip_case_number: selected.aip_case_number,
          mitigation: selected.mitigation,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selected.id);
      if (error) throw error;
      toast.success('U ruajt me sukses.');
      setSelected(null);
      load();
    } catch (err) {
      console.error('Error updating breach:', err);
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-rose-100 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Regjistri i Shkeljeve të të Dhënave</h1>
            <p className="text-sm text-slate-500">Ligji 06/L-082, Neni 7 — njoftim te AIP</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Regjistro shkelje
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
      ) : breaches.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold">Asnjë shkelje e regjistruar</p>
          <p className="text-sm text-slate-500 mt-1">Çdo shkelje sigurie e të dhënave personale duhet dokumentuar dhe njoftuar te AIP.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {breaches.map((b) => (
            <button key={b.id} onClick={() => setSelected(b)} className="w-full text-left bg-white border border-slate-100 rounded-2xl p-4 hover:border-rose-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-slate-900">{b.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_STYLES[b.severity]}`}>{BREACH_SEVERITY_LABELS[b.severity]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[b.status]}`}>{BREACH_STATUS_LABELS[b.status]}</span>
                  </div>
                  {b.description && <p className="text-sm text-slate-600 line-clamp-2">{b.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.discovered_at}</span>
                    {b.num_subjects_affected != null && <span>{b.num_subjects_affected} subjekte</span>}
                    {b.reporter_name && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {b.reporter_name}</span>}
                  </div>
                </div>
                {b.reported_to_aip && <span className="inline-flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle className="w-3.5 h-3.5" /> AIP</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Regjistro shkelje</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Titulli *</span>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Përshkrimi</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <div>
                <span className="text-sm font-medium text-slate-700">Llojet e të dhënave të prekura</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {DATA_TYPES.map((tp) => (
                    <button type="button" key={tp} onClick={() => toggleType(tp)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${form.affected_data_types.includes(tp) ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                      {BREACH_DATA_TYPE_LABELS[tp]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Data</span>
                  <input type="date" value={form.discovered_at} onChange={(e) => setForm({ ...form, discovered_at: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Rëndësia</span>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as BreachSeverity })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                    {Object.entries(BREACH_SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nr. subjekteve</span>
                  <input type="number" min="0" value={form.num_subjects_affected} onChange={(e) => setForm({ ...form, num_subjects_affected: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
                </label>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Regjistro
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {selected.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.description}</p>}
              {selected.affected_data_types.length > 0 && (
                <p className="text-xs text-slate-500">Të dhënat: {selected.affected_data_types.map((tp) => BREACH_DATA_TYPE_LABELS[tp] || tp).join(', ')}</p>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Statusi</span>
                <select defaultValue={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value as BreachStatus })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                  {Object.entries(BREACH_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={selected.reported_to_aip}
                  onChange={(e) => setSelected({ ...selected, reported_to_aip: e.target.checked, aip_reported_at: e.target.checked ? (selected.aip_reported_at || new Date().toISOString().slice(0, 10)) : null })} />
                Njoftuar te AIP
              </label>
              {selected.reported_to_aip && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Data e njoftimit AIP</span>
                    <input type="date" defaultValue={selected.aip_reported_at || ''} onChange={(e) => setSelected({ ...selected, aip_reported_at: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Nr. i rastit AIP</span>
                    <input type="text" defaultValue={selected.aip_case_number} onChange={(e) => setSelected({ ...selected, aip_case_number: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
                  </label>
                </div>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Masat zbutëse</span>
                <textarea defaultValue={selected.mitigation} rows={3} onChange={(e) => setSelected({ ...selected, mitigation: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <button onClick={update} className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium">
                Ruaj ndryshimet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
