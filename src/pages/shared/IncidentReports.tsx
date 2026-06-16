import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import {
  ShieldAlert, Plus, X, Loader2, MapPin, Calendar, User, CheckCircle, Clock,
} from 'lucide-react';
import {
  INCIDENT_TYPE_LABELS, INCIDENT_SEVERITY_LABELS, INCIDENT_STATUS_LABELS,
  type IncidentReport, type IncidentType, type IncidentSeverity, type IncidentStatus,
} from '../../types/database';

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  lehte: 'bg-amber-100 text-amber-700',
  mesatare: 'bg-orange-100 text-orange-700',
  rende: 'bg-rose-100 text-rose-700',
};

const STATUS_STYLES: Record<IncidentStatus, string> = {
  i_hapur: 'bg-blue-100 text-blue-700',
  ne_proces: 'bg-violet-100 text-violet-700',
  mbyllur: 'bg-emerald-100 text-emerald-700',
};

const emptyForm = {
  incident_date: new Date().toISOString().slice(0, 10),
  incident_type: 'bullizem' as IncidentType,
  severity: 'mesatare' as IncidentSeverity,
  location: '',
  description: '',
  witnesses: '',
};

export default function IncidentReports() {
  const { profile } = useAuth();
  const toast = useToast();
  const isManager = profile?.role === 'drejtor' || profile?.role === 'pedagog';

  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<IncidentReport | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [profile]);

  const loadIncidents = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incident_reports')
        .select('*, reporter:reported_by(full_name)')
        .order('incident_date', { ascending: false });
      if (error) throw error;
      type Row = IncidentReport & { reporter?: { full_name: string } | null };
      setIncidents((data as Row[] | null || []).map((r) => ({ ...r, reporter_name: r.reporter?.full_name || '' })));
    } catch (err) {
      console.error('Error loading incidents:', err);
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('incident_reports').insert({
        incident_date: form.incident_date,
        incident_type: form.incident_type,
        severity: form.severity,
        location: form.location,
        description: form.description,
        witnesses: form.witnesses,
        reported_by: profile.id,
      });
      if (error) throw error;
      toast.success('Incidenti u raportua.');
      setShowForm(false);
      setForm({ ...emptyForm });
      loadIncidents();
    } catch (err) {
      console.error('Error reporting incident:', err);
      toast.error('Diçka shkoi keq. Provoni përsëri.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateIncident = async (patch: Partial<IncidentReport>) => {
    if (!selected || !profile) return;
    try {
      const { error } = await supabase
        .from('incident_reports')
        .update({ ...patch, reviewed_by: profile.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', selected.id);
      if (error) throw error;
      toast.success('U ruajt me sukses.');
      setSelected(null);
      loadIncidents();
    } catch (err) {
      console.error('Error updating incident:', err);
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
            <h1 className="text-xl font-bold text-slate-900">Raportimi i Incidenteve</h1>
            <p className="text-sm text-slate-500">Mbrojtja e fëmijëve nga dhuna (UA 13/2018) — konfidenciale</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Raporto incident
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-900 font-semibold">Nuk ka incidente të raportuara</p>
          <p className="text-sm text-slate-500 mt-1">Çdo rast dhune, bullizmi apo ngacmimi duhet raportuar menjëherë.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <button
              key={inc.id}
              onClick={() => isManager && setSelected(inc)}
              className={`w-full text-left bg-white border border-slate-100 rounded-2xl p-4 ${isManager ? 'hover:border-rose-200' : 'cursor-default'} transition-colors`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-semibold text-slate-900">{INCIDENT_TYPE_LABELS[inc.incident_type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_STYLES[inc.severity]}`}>{INCIDENT_SEVERITY_LABELS[inc.severity]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[inc.status]}`}>{INCIDENT_STATUS_LABELS[inc.status]}</span>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{inc.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {inc.incident_date}</span>
                    {inc.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {inc.location}</span>}
                    {inc.reporter_name && <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> {inc.reporter_name}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  {inc.parent_notified_at && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Prindi njoftuar</span>}
                  {inc.police_notified && <span className="inline-flex items-center gap-1 text-blue-600"><CheckCircle className="w-3.5 h-3.5" /> Policia</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modal raportimi */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Raporto incident</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitReport} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Data</span>
                  <input type="date" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" required />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Vendi</span>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="p.sh. oborri i shkollës" className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Lloji</span>
                  <select value={form.incident_type} onChange={(e) => setForm({ ...form, incident_type: e.target.value as IncidentType })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Rëndësia</span>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                    {Object.entries(INCIDENT_SEVERITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Përshkrimi *</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required
                  placeholder="Çfarë ndodhi, kush ishte i përfshirë…" className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Dëshmitarë</span>
                <input type="text" value={form.witnesses} onChange={(e) => setForm({ ...form, witnesses: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <button type="submit" disabled={submitting}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Dërgo raportin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal menaxhimi (vetëm drejtor/pedagog) */}
      {selected && isManager && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">{INCIDENT_TYPE_LABELS[selected.incident_type]}</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{selected.description}</p>
              {selected.witnesses && <p className="text-xs text-slate-500">Dëshmitarë: {selected.witnesses}</p>}

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Statusi</span>
                <select defaultValue={selected.status}
                  onChange={(e) => setSelected({ ...selected, status: e.target.value as IncidentStatus })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
                  {Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Veprimet e drejtorit</span>
                <textarea defaultValue={selected.director_actions} rows={3}
                  onChange={(e) => setSelected({ ...selected, director_actions: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
              </label>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked={!!selected.parent_notified_at}
                    onChange={(e) => setSelected({ ...selected, parent_notified_at: e.target.checked ? new Date().toISOString() : null })} />
                  Prindi u njoftua
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked={selected.police_notified}
                    onChange={(e) => setSelected({ ...selected, police_notified: e.target.checked })} />
                  Policia u njoftua
                </label>
              </div>
              {selected.police_notified && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Nr. i raportit të policisë</span>
                  <input type="text" defaultValue={selected.police_report_number}
                    onChange={(e) => setSelected({ ...selected, police_report_number: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" />
                </label>
              )}
              <button
                onClick={() => updateIncident({
                  status: selected.status,
                  director_actions: selected.director_actions,
                  parent_notified_at: selected.parent_notified_at,
                  police_notified: selected.police_notified,
                  police_report_number: selected.police_report_number,
                })}
                className="w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium inline-flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" /> Ruaj ndryshimet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
