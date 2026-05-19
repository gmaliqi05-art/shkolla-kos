import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ANNUAL_PLAN_STATUS_LABELS,
  ANNUAL_PLAN_STATUS_COLORS,
  PLAN_OBJECTIVE_AREA_LABELS,
  PLAN_OBJECTIVE_STATUS_LABELS,
  type AnnualPlanStatus,
  type AnnualSchoolPlan,
  type PlanObjective,
  type PlanObjectiveArea,
  type PlanObjectiveStatus,
} from '../../types/database';
import { Loader2, FileSpreadsheet, Plus, X, Edit2, Save, Trash2, Target, CheckCircle, Printer } from 'lucide-react';

interface AcademicYear { id: string; name: string }

export default function AnnualPlan() {
  const { profile } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [plans, setPlans] = useState<AnnualSchoolPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<AnnualSchoolPlan | null>(null);
  const [objectives, setObjectives] = useState<PlanObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showObjModal, setShowObjModal] = useState(false);
  const [editingObj, setEditingObj] = useState<PlanObjective | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    academic_year_id: '',
    title: '',
    vision: '',
    mission: '',
    values_principles: '',
    analysis_situation: '',
    priority_areas: '',
    general_goals: '',
    resources: '',
    evaluation_methods: '',
    status: 'draft' as AnnualPlanStatus,
  });

  const [objForm, setObjForm] = useState({
    area: 'mesimore' as PlanObjectiveArea,
    title: '',
    description: '',
    expected_outcome: '',
    responsible_person: '',
    start_date: '',
    target_date: '',
    status: 'planifikuar' as PlanObjectiveStatus,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [yearsRes, plansRes] = await Promise.all([
      supabase.from('academic_years').select('id, name').order('start_date', { ascending: false }),
      supabase.from('annual_school_plans').select('*').order('created_at', { ascending: false }),
    ]);
    setYears(yearsRes.data || []);
    setPlans(plansRes.data || []);
    if (plansRes.data && plansRes.data.length > 0 && !selectedPlan) {
      setSelectedPlan(plansRes.data[0]);
      await loadObjectives(plansRes.data[0].id);
    }
    setLoading(false);
  };

  const loadObjectives = async (planId: string) => {
    const { data } = await supabase
      .from('plan_objectives')
      .select('*')
      .eq('plan_id', planId)
      .order('area')
      .order('target_date');
    setObjectives(data || []);
  };

  const selectPlan = async (p: AnnualSchoolPlan) => {
    setSelectedPlan(p);
    setEditing(false);
    await loadObjectives(p.id);
  };

  const openNew = () => {
    setSelectedPlan(null);
    setForm({
      academic_year_id: years[0]?.id || '',
      title: `Plani Vjetor i Shkollës ${years[0]?.name || ''}`.trim(),
      vision: '',
      mission: '',
      values_principles: '',
      analysis_situation: '',
      priority_areas: '',
      general_goals: '',
      resources: '',
      evaluation_methods: '',
      status: 'draft',
    });
    setEditing(true);
    setError('');
  };

  const openEdit = () => {
    if (!selectedPlan) return;
    setForm({
      academic_year_id: selectedPlan.academic_year_id || '',
      title: selectedPlan.title,
      vision: selectedPlan.vision,
      mission: selectedPlan.mission,
      values_principles: selectedPlan.values_principles,
      analysis_situation: selectedPlan.analysis_situation,
      priority_areas: selectedPlan.priority_areas,
      general_goals: selectedPlan.general_goals,
      resources: selectedPlan.resources,
      evaluation_methods: selectedPlan.evaluation_methods,
      status: selectedPlan.status,
    });
    setEditing(true);
    setError('');
  };

  const savePlan = async () => {
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      academic_year_id: form.academic_year_id || null,
      title: form.title,
      vision: form.vision,
      mission: form.mission,
      values_principles: form.values_principles,
      analysis_situation: form.analysis_situation,
      priority_areas: form.priority_areas,
      general_goals: form.general_goals,
      resources: form.resources,
      evaluation_methods: form.evaluation_methods,
      status: form.status,
      updated_at: new Date().toISOString(),
    };
    let res;
    if (selectedPlan) {
      res = await supabase.from('annual_school_plans').update(payload).eq('id', selectedPlan.id).select().single();
    } else {
      res = await supabase
        .from('annual_school_plans')
        .insert({ ...payload, created_by: profile.id })
        .select()
        .single();
    }
    if (res.error) {
      setError(res.error.message);
    } else {
      setMessage('Plani u ruajt me sukses.');
      setEditing(false);
      load();
      if (res.data) setSelectedPlan(res.data);
    }
    setSubmitting(false);
  };

  const approve = async () => {
    if (!selectedPlan || !profile) return;
    if (!confirm('Mirato këtë plan vjetor?')) return;
    const { error } = await supabase
      .from('annual_school_plans')
      .update({
        status: 'miratuar',
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', selectedPlan.id);
    if (!error) {
      setMessage('Plani u miratua.');
      load();
    }
  };

  const remove = async () => {
    if (!selectedPlan) return;
    if (!confirm('Fshij këtë plan vjetor?')) return;
    await supabase.from('annual_school_plans').delete().eq('id', selectedPlan.id);
    setSelectedPlan(null);
    load();
  };

  const openObjNew = () => {
    setEditingObj(null);
    setObjForm({
      area: 'mesimore',
      title: '',
      description: '',
      expected_outcome: '',
      responsible_person: '',
      start_date: '',
      target_date: '',
      status: 'planifikuar',
    });
    setShowObjModal(true);
    setError('');
  };

  const openObjEdit = (o: PlanObjective) => {
    setEditingObj(o);
    setObjForm({
      area: o.area,
      title: o.title,
      description: o.description,
      expected_outcome: o.expected_outcome,
      responsible_person: o.responsible_person,
      start_date: o.start_date || '',
      target_date: o.target_date || '',
      status: o.status,
    });
    setShowObjModal(true);
    setError('');
  };

  const saveObj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubmitting(true);
    setError('');
    const payload = {
      plan_id: selectedPlan.id,
      area: objForm.area,
      title: objForm.title,
      description: objForm.description,
      expected_outcome: objForm.expected_outcome,
      responsible_person: objForm.responsible_person,
      start_date: objForm.start_date || null,
      target_date: objForm.target_date || null,
      status: objForm.status,
    };
    const res = editingObj
      ? await supabase.from('plan_objectives').update(payload).eq('id', editingObj.id)
      : await supabase.from('plan_objectives').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowObjModal(false);
      loadObjectives(selectedPlan.id);
    }
    setSubmitting(false);
  };

  const removeObj = async (id: string) => {
    if (!confirm('Fshij këtë objektiv?')) return;
    if (selectedPlan) {
      await supabase.from('plan_objectives').delete().eq('id', id);
      loadObjectives(selectedPlan.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  // Group objectives by area
  const objByArea = new Map<PlanObjectiveArea, PlanObjective[]>();
  objectives.forEach((o) => {
    const list = objByArea.get(o.area) || [];
    list.push(o);
    objByArea.set(o.area, list);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Plani Vjetor i Shkollës</h1>
            <p className="text-slate-500 text-sm">Dokument zyrtar — detyrim ligjor i drejtorit</p>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedPlan && (
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl">
              <Printer className="w-4 h-4" />
              Printo
            </button>
          )}
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Krijo Plan
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-2 print:hidden">
          {message}
        </div>
      )}

      {plans.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4 print:hidden">
          <label className="block text-xs font-medium text-slate-500 mb-1">Plani aktiv</label>
          <select
            value={selectedPlan?.id || ''}
            onChange={(e) => {
              const p = plans.find((pp) => pp.id === e.target.value);
              if (p) selectPlan(p);
            }}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 min-w-[300px]"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {ANNUAL_PLAN_STATUS_LABELS[p.status]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* PLAN VIEW or EDIT */}
      {editing ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
          <h2 className="text-lg font-bold text-slate-900">{selectedPlan ? 'Edito Planin' : 'Plan i Ri'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Viti akademik</label>
              <select value={form.academic_year_id} onChange={(e) => setForm({ ...form, academic_year_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">— Pa specifikim —</option>
                {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AnnualPlanStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                {(Object.keys(ANNUAL_PLAN_STATUS_LABELS) as AnnualPlanStatus[]).map((s) => (
                  <option key={s} value={s}>{ANNUAL_PLAN_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titulli i planit *</label>
            <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          {[
            { key: 'vision', label: 'Vizioni i shkollës' },
            { key: 'mission', label: 'Misioni i shkollës' },
            { key: 'values_principles', label: 'Vlerat dhe parimet' },
            { key: 'analysis_situation', label: 'Analiza e gjendjes aktuale' },
            { key: 'priority_areas', label: 'Fushat prioritare' },
            { key: 'general_goals', label: 'Qëllimet e përgjithshme' },
            { key: 'resources', label: 'Burimet (njerëzore, materiale, financiare)' },
            { key: 'evaluation_methods', label: 'Metodat e vlerësimit dhe monitorimit' },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
              <textarea rows={3} value={(form as unknown as Record<string, string>)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            </div>
          ))}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button onClick={() => setEditing(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
            <button onClick={savePlan} disabled={submitting} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Ruaj Planin
            </button>
          </div>
        </div>
      ) : !selectedPlan ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë plan i krijuar ende. Krijo planin e parë vjetor.
        </div>
      ) : (
        <div id="plan-content" className="bg-white rounded-2xl border border-slate-200 p-8 space-y-5 print:border-0 print:shadow-none">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${ANNUAL_PLAN_STATUS_COLORS[selectedPlan.status]}`}>
                {ANNUAL_PLAN_STATUS_LABELS[selectedPlan.status]}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">{selectedPlan.title}</h2>
              {selectedPlan.approved_at && (
                <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Miratuar më {new Date(selectedPlan.approved_at).toLocaleDateString('sq')}
                </p>
              )}
            </div>
            <div className="flex gap-1 print:hidden">
              {selectedPlan.status === 'draft' && (
                <button onClick={approve} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                  Mirato
                </button>
              )}
              <button onClick={openEdit} className="p-1.5 text-slate-400 hover:text-slate-700">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={remove} className="p-1.5 text-slate-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {[
            { key: 'vision', label: '1. Vizioni' },
            { key: 'mission', label: '2. Misioni' },
            { key: 'values_principles', label: '3. Vlerat dhe parimet' },
            { key: 'analysis_situation', label: '4. Analiza e gjendjes' },
            { key: 'priority_areas', label: '5. Fushat prioritare' },
            { key: 'general_goals', label: '6. Qëllimet e përgjithshme' },
            { key: 'resources', label: '7. Burimet' },
            { key: 'evaluation_methods', label: '8. Metodat e vlerësimit' },
          ].map((f) => {
            const val = (selectedPlan as unknown as Record<string, string>)[f.key];
            if (!val) return null;
            return (
              <section key={f.key}>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{f.label}</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{val}</p>
              </section>
            );
          })}

          <section className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                9. Objektivat
              </h3>
              <button onClick={openObjNew} className="text-xs text-purple-600 hover:text-purple-800 font-medium print:hidden">+ Shto objektiv</button>
            </div>

            {objByArea.size === 0 ? (
              <p className="text-sm text-slate-400 italic">Asnjë objektiv i shtuar.</p>
            ) : (
              <div className="space-y-4">
                {Array.from(objByArea.entries()).map(([area, objs]) => (
                  <div key={area}>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">{PLAN_OBJECTIVE_AREA_LABELS[area]}</h4>
                    <ul className="space-y-2">
                      {objs.map((o) => (
                        <li key={o.id} className="bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-slate-900">{o.title}</p>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                  {PLAN_OBJECTIVE_STATUS_LABELS[o.status]}
                                </span>
                              </div>
                              {o.description && <p className="text-sm text-slate-600 mt-1">{o.description}</p>}
                              {o.expected_outcome && <p className="text-xs text-slate-500 mt-1"><strong>Rezultati i pritur:</strong> {o.expected_outcome}</p>}
                              <p className="text-xs text-slate-500 mt-1">
                                {o.responsible_person && `Përgjegjës: ${o.responsible_person}`}
                                {o.start_date && ` · Fillon: ${o.start_date}`}
                                {o.target_date && ` · Target: ${o.target_date}`}
                              </p>
                            </div>
                            <div className="flex gap-1 print:hidden">
                              <button onClick={() => openObjEdit(o)} className="p-1 text-slate-400 hover:text-slate-700">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => removeObj(o.id)} className="p-1 text-slate-400 hover:text-rose-600">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          {selectedPlan.approved_notes && (
            <section className="pt-4 border-t border-slate-200 bg-emerald-50 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-emerald-900">Shënime nga miratimi</h4>
              <p className="text-sm text-emerald-900 mt-1">{selectedPlan.approved_notes}</p>
            </section>
          )}
        </div>
      )}

      {/* Objective modal */}
      {showObjModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingObj ? 'Edito Objektivin' : 'Objektiv i Ri'}</h2>
              <button onClick={() => setShowObjModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={saveObj} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fusha *</label>
                  <select required value={objForm.area} onChange={(e) => setObjForm({ ...objForm, area: e.target.value as PlanObjectiveArea })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                    {(Object.keys(PLAN_OBJECTIVE_AREA_LABELS) as PlanObjectiveArea[]).map((a) => (
                      <option key={a} value={a}>{PLAN_OBJECTIVE_AREA_LABELS[a]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                  <select value={objForm.status} onChange={(e) => setObjForm({ ...objForm, status: e.target.value as PlanObjectiveStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                    {(Object.keys(PLAN_OBJECTIVE_STATUS_LABELS) as PlanObjectiveStatus[]).map((s) => (
                      <option key={s} value={s}>{PLAN_OBJECTIVE_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={objForm.title} onChange={(e) => setObjForm({ ...objForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea rows={2} value={objForm.description} onChange={(e) => setObjForm({ ...objForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rezultati i pritur</label>
                <textarea rows={2} value={objForm.expected_outcome} onChange={(e) => setObjForm({ ...objForm, expected_outcome: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përgjegjësi/ja</label>
                <input type="text" value={objForm.responsible_person} onChange={(e) => setObjForm({ ...objForm, responsible_person: e.target.value })} placeholder="Emër ose pozicion" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fillon</label>
                  <input type="date" value={objForm.start_date} onChange={(e) => setObjForm({ ...objForm, start_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target</label>
                  <input type="date" value={objForm.target_date} onChange={(e) => setObjForm({ ...objForm, target_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowObjModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
