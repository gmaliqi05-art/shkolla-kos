import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  INSPECTION_TYPE_LABELS,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  OVERALL_RATING_LABELS,
  OVERALL_RATING_COLORS,
  type InspectionType,
  type InspectionStatus,
  type OverallRating,
  type Inspection,
} from '../../types/database';
import { Link } from 'react-router-dom';
import { Loader2, ClipboardCheck, Plus, X, Edit2, CheckCircle } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface SchoolOption { id: string; name: string; municipality?: string }
interface InspectionRow extends Inspection {
  school_name?: string;
}

export default function InspectionsManagement() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isInspector = profile?.role === 'inspektor';
  const isDirector = profile?.role === 'drejtor';
  const isMinistri = profile?.role === 'ministri';
  const isDka = profile?.role === 'drejtor_komunal';

  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<InspectionStatus | ''>('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Inspection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    school_id: '',
    inspection_type: 'e_rregullt' as InspectionType,
    planned_date: new Date().toISOString().slice(0, 10),
    conducted_date: '',
    duration_hours: '',
    scope: '',
    status: 'planifikuar' as InspectionStatus,
    overall_rating: '' as OverallRating | '',
    summary: '',
  });

  useEffect(() => {
    load();
  }, [profile?.id]);

  const load = async () => {
    let query = supabase.from('inspections').select('*').order('planned_date', { ascending: false });
    if (isDirector && profile?.school_id) query = query.eq('school_id', profile.school_id);
    if (isInspector && profile?.id) query = query.eq('inspector_id', profile.id);
    const inspRes = await query;
    const items: Inspection[] = inspRes.data || [];

    const schoolIds = Array.from(new Set(items.map((i) => i.school_id)));
    let schoolList: SchoolOption[] = [];
    if (schoolIds.length > 0) {
      const { data: sdata } = await supabase.from('school_info').select('id, name, municipality').in('id', schoolIds);
      schoolList = sdata || [];
    }

    // Always load all schools for the inspector dropdown
    if (isInspector || isMinistri || isDka) {
      const { data: allSchools } = await supabase.from('school_info').select('id, name, municipality').order('name');
      setSchools(allSchools || []);
    } else {
      setSchools(schoolList);
    }

    const sMap = new Map(schoolList.map((s) => [s.id, s.name]));
    setInspections(items.map((i) => ({ ...i, school_name: sMap.get(i.school_id) || 'Shkollë e panjohur' })));
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      school_id: schools[0]?.id || '',
      inspection_type: 'e_rregullt',
      planned_date: new Date().toISOString().slice(0, 10),
      conducted_date: '',
      duration_hours: '',
      scope: '',
      status: 'planifikuar',
      overall_rating: '',
      summary: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (i: Inspection) => {
    setEditing(i);
    setForm({
      school_id: i.school_id,
      inspection_type: i.inspection_type,
      planned_date: i.planned_date,
      conducted_date: i.conducted_date || '',
      duration_hours: i.duration_hours ? String(i.duration_hours) : '',
      scope: i.scope,
      status: i.status,
      overall_rating: i.overall_rating || '',
      summary: i.summary,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      school_id: form.school_id,
      inspector_id: profile.id,
      inspection_type: form.inspection_type,
      planned_date: form.planned_date,
      conducted_date: form.conducted_date || null,
      duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      scope: form.scope,
      status: form.status,
      overall_rating: form.overall_rating || null,
      summary: form.summary,
      updated_at: new Date().toISOString(),
    };
    const res = editing
      ? await supabase.from('inspections').update({ ...payload, inspector_id: undefined }).eq('id', editing.id)
      : await supabase.from('inspections').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  const acknowledge = async (i: Inspection) => {
    if (!isDirector) return;
    const comments = prompt('Komente ose pranim (opsional):', '');
    if (comments === null) return;
    await supabase
      .from('inspections')
      .update({ approved_by_director: true, approved_at: new Date().toISOString(), director_comments: comments })
      .eq('id', i.id);
    load();
  };

  const filtered = filterStatus ? inspections.filter((i) => i.status === filterStatus) : inspections;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('im.title')}</h1>
            <p className="text-slate-500 text-sm">{t('im.subtitle')}</p>
          </div>
        </div>
        {isInspector && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Planifiko Inspektim
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-2">
        <button onClick={() => setFilterStatus('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          Të gjitha ({inspections.length})
        </button>
        {(Object.keys(INSPECTION_STATUS_LABELS) as InspectionStatus[]).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === s ? INSPECTION_STATUS_COLORS[s] : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {INSPECTION_STATUS_LABELS[s]} ({inspections.filter((i) => i.status === s).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë inspektim i regjistruar.
          </div>
        ) : (
          filtered.map((i) => (
            <div key={i.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${INSPECTION_STATUS_COLORS[i.status]}`}>
                      {INSPECTION_STATUS_LABELS[i.status]}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">
                      {INSPECTION_TYPE_LABELS[i.inspection_type]}
                    </span>
                    {i.overall_rating && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${OVERALL_RATING_COLORS[i.overall_rating]}`}>
                        ★ {OVERALL_RATING_LABELS[i.overall_rating]}
                      </span>
                    )}
                    {i.approved_by_director && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3" />
                        Pranuar nga drejtori
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-2">{i.school_name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Planifikuar: {i.planned_date}
                    {i.conducted_date && ` · Mbajtur: ${i.conducted_date}`}
                    {i.duration_hours && ` · Kohëzgjatja: ${i.duration_hours}h`}
                  </p>
                  {i.scope && <p className="text-sm text-slate-700 mt-2 italic">Fokusi: {i.scope}</p>}
                  {i.summary && <p className="text-sm text-slate-700 mt-2">{i.summary}</p>}
                  {i.director_comments && (
                    <div className="mt-2 bg-emerald-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-emerald-900">Komente nga drejtori:</p>
                      <p className="text-sm text-emerald-900">{i.director_comments}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Link
                    to={isDirector ? `/drejtor/inspektimet/${i.id}` : `/inspektor/inspektimet/${i.id}`}
                    className="px-2.5 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-center"
                  >
                    Hap detajet
                  </Link>
                  {isInspector && (
                    <button onClick={() => openEdit(i)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {isDirector && !i.approved_by_director && i.status === 'perfunduar' && (
                    <button onClick={() => acknowledge(i)} className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded">
                      Prano
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Inspektimin' : 'Inspektim i Ri'}</h2>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shkolla *</label>
                <select required value={form.school_id} onChange={(e) => setForm({ ...form, school_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">— Zgjidh —</option>
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}{s.municipality ? ` (${s.municipality})` : ''}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipi *</label>
                  <select required value={form.inspection_type} onChange={(e) => setForm({ ...form, inspection_type: e.target.value as InspectionType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    {(Object.keys(INSPECTION_TYPE_LABELS) as InspectionType[]).map((t) => (
                      <option key={t} value={t}>{INSPECTION_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InspectionStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    {(Object.keys(INSPECTION_STATUS_LABELS) as InspectionStatus[]).map((s) => (
                      <option key={s} value={s}>{INSPECTION_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e planifikuar *</label>
                  <input required type="date" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e mbajtjes</label>
                  <input type="date" value={form.conducted_date} onChange={(e) => setForm({ ...form, conducted_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kohëzgjatja (orë)</label>
                  <input type="number" step="0.5" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vlerësimi i përgjithshëm</label>
                  <select value={form.overall_rating} onChange={(e) => setForm({ ...form, overall_rating: e.target.value as OverallRating | '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="">— Pa specifikim —</option>
                    {(Object.keys(OVERALL_RATING_LABELS) as OverallRating[]).map((r) => (
                      <option key={r} value={r}>{OVERALL_RATING_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fokusi i inspektimit</label>
                <input type="text" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} placeholder="P.sh. dokumentacioni pedagogjik, siguria, etj." className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përmbledhja e inspektimit</label>
                <textarea rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
