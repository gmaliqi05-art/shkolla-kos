import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import {
  SPECIAL_NEED_LABELS,
  SEVERITY_LABELS,
  IEP_STATUS_LABELS,
  IEP_GOAL_AREA_LABELS,
  IEP_GOAL_STATUS_LABELS,
  IEP_ACCOMMODATION_LABELS,
  type SpecialNeed,
  type SpecialNeedCategory,
  type SpecialNeedSeverity,
  type IndividualEducationPlan,
  type IEPStatus,
  type IEPGoal,
  type IEPGoalArea,
  type IEPGoalStatus,
  type IEPAccommodation,
  type IEPAccommodationType,
} from '../../types/database';
import { Loader2, Plus, X, Heart, Target, Sparkles, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

interface StudentOption {
  id: string;
  full_name: string;
  class_name?: string;
}

interface NeedRow extends SpecialNeed {
  student_name?: string;
  class_name?: string;
}

interface IEPWithDetails extends IndividualEducationPlan {
  student_name?: string;
  goals?: IEPGoal[];
  accommodations?: IEPAccommodation[];
}

export default function SpecialNeedsManagement() {
  const { profile } = useAuth();
  const [needs, setNeeds] = useState<NeedRow[]>([]);
  const [ieps, setIeps] = useState<IEPWithDetails[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'needs' | 'ieps'>('needs');
  const [expandedIep, setExpandedIep] = useState<string | null>(null);

  // Need form
  const [showNeedModal, setShowNeedModal] = useState(false);
  const [editingNeed, setEditingNeed] = useState<NeedRow | null>(null);
  const [needForm, setNeedForm] = useState({
    student_id: '',
    category: 'gjuhesore' as SpecialNeedCategory,
    severity: '' as SpecialNeedSeverity | '',
    diagnosis: '',
    diagnosed_at: '',
    diagnosed_by: '',
    notes: '',
  });

  // IEP form
  const [showIepModal, setShowIepModal] = useState(false);
  const [editingIep, setEditingIep] = useState<IEPWithDetails | null>(null);
  const [iepForm, setIepForm] = useState({
    student_id: '',
    title: '',
    description: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    status: 'draft' as IEPStatus,
  });

  // Goal form
  const [showGoalModal, setShowGoalModal] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({
    goal_area: 'akademik' as IEPGoalArea,
    description: '',
    target_date: '',
    achievement_criteria: '',
    status: 'ne_proces' as IEPGoalStatus,
  });

  // Accommodation form
  const [showAccModal, setShowAccModal] = useState<string | null>(null);
  const [accForm, setAccForm] = useState({
    accommodation_type: 'kohe_shtese_provim' as IEPAccommodationType,
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadNeeds(), loadIeps(), loadStudents()]);
    setLoading(false);
  };

  const loadStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'nxenes')
      .is('deleted_at', null)
      .order('full_name');
    const enrolls = await supabase.from('student_classes').select('student_id, class_id');
    const classes = await supabase.from('classes').select('id, name');
    const classMap = new Map((classes.data || []).map((c) => [c.id, c.name]));
    const enrollMap = new Map<string, string>();
    (enrolls.data || []).forEach((e) => enrollMap.set(e.student_id, classMap.get(e.class_id) || ''));
    setStudents((data || []).map((s) => ({ ...s, class_name: enrollMap.get(s.id) })));
  };

  const loadNeeds = async () => {
    const { data } = await supabase
      .from('special_needs')
      .select('*')
      .order('created_at', { ascending: false });
    const items: SpecialNeed[] = data || [];
    if (items.length === 0) {
      setNeeds([]);
      return;
    }
    const ids = Array.from(new Set(items.map((n) => n.student_id)));
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
    setNeeds(items.map((n) => ({ ...n, student_name: nameMap.get(n.student_id) || '—' })));
  };

  const loadIeps = async () => {
    const { data: iepData } = await supabase
      .from('individual_education_plans')
      .select('*')
      .order('created_at', { ascending: false });
    const items: IndividualEducationPlan[] = iepData || [];
    if (items.length === 0) {
      setIeps([]);
      return;
    }
    const studentIds = Array.from(new Set(items.map((i) => i.student_id)));
    const iepIds = items.map((i) => i.id);
    const [profilesRes, goalsRes, accRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      supabase.from('iep_goals').select('*').in('iep_id', iepIds),
      supabase.from('iep_accommodations').select('*').in('iep_id', iepIds),
    ]);
    const nameMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name]));
    const goalsByIep = new Map<string, IEPGoal[]>();
    (goalsRes.data || []).forEach((g: IEPGoal) => {
      const list = goalsByIep.get(g.iep_id) || [];
      list.push(g);
      goalsByIep.set(g.iep_id, list);
    });
    const accByIep = new Map<string, IEPAccommodation[]>();
    (accRes.data || []).forEach((a: IEPAccommodation) => {
      const list = accByIep.get(a.iep_id) || [];
      list.push(a);
      accByIep.set(a.iep_id, list);
    });
    setIeps(items.map((i) => ({
      ...i,
      student_name: nameMap.get(i.student_id) || '—',
      goals: goalsByIep.get(i.id) || [],
      accommodations: accByIep.get(i.id) || [],
    })));
  };

  const openNewNeed = () => {
    setError('');
    setEditingNeed(null);
    setNeedForm({
      student_id: '',
      category: 'gjuhesore',
      severity: '',
      diagnosis: '',
      diagnosed_at: '',
      diagnosed_by: '',
      notes: '',
    });
    setShowNeedModal(true);
  };

  const openEditNeed = (n: NeedRow) => {
    setError('');
    setEditingNeed(n);
    setNeedForm({
      student_id: n.student_id,
      category: n.category,
      severity: n.severity || '',
      diagnosis: n.diagnosis,
      diagnosed_at: n.diagnosed_at || '',
      diagnosed_by: n.diagnosed_by,
      notes: n.notes,
    });
    setShowNeedModal(true);
  };

  const submitNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      student_id: needForm.student_id,
      category: needForm.category,
      severity: needForm.severity || null,
      diagnosis: needForm.diagnosis,
      diagnosed_at: needForm.diagnosed_at || null,
      diagnosed_by: needForm.diagnosed_by,
      notes: needForm.notes,
      created_by: profile.id,
    };
    let result;
    if (editingNeed) {
      result = await supabase.from('special_needs').update(payload).eq('id', editingNeed.id);
    } else {
      result = await supabase.from('special_needs').insert(payload);
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: editingNeed ? 'update' : 'create',
        resourceType: 'special_need',
        targetUserId: needForm.student_id,
        metadata: { category: needForm.category },
      });
      setShowNeedModal(false);
      loadNeeds();
    }
    setSubmitting(false);
  };

  const submitIep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      student_id: iepForm.student_id,
      title: iepForm.title,
      description: iepForm.description,
      start_date: iepForm.start_date,
      end_date: iepForm.end_date || null,
      status: iepForm.status,
      created_by: profile.id,
      coordinator_id: profile.id,
    };
    let result;
    if (editingIep) {
      const { created_by: _ignore, ...updatePayload } = payload;
      result = await supabase.from('individual_education_plans').update(updatePayload).eq('id', editingIep.id);
    } else {
      result = await supabase.from('individual_education_plans').insert(payload);
    }
    if (result.error) {
      setError(result.error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: editingIep ? 'update' : 'create',
        resourceType: 'iep',
        targetUserId: iepForm.student_id,
      });
      setShowIepModal(false);
      loadIeps();
    }
    setSubmitting(false);
  };

  const submitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showGoalModal || !profile) return;
    setSubmitting(true);
    const { error } = await supabase.from('iep_goals').insert({
      iep_id: showGoalModal,
      goal_area: goalForm.goal_area,
      description: goalForm.description,
      target_date: goalForm.target_date || null,
      achievement_criteria: goalForm.achievement_criteria,
      status: goalForm.status,
    });
    if (error) {
      setError(error.message);
    } else {
      setShowGoalModal(null);
      setGoalForm({ goal_area: 'akademik', description: '', target_date: '', achievement_criteria: '', status: 'ne_proces' });
      loadIeps();
    }
    setSubmitting(false);
  };

  const submitAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAccModal || !profile) return;
    setSubmitting(true);
    const { error } = await supabase.from('iep_accommodations').insert({
      iep_id: showAccModal,
      accommodation_type: accForm.accommodation_type,
      description: accForm.description,
    });
    if (error) {
      setError(error.message);
    } else {
      setShowAccModal(null);
      setAccForm({ accommodation_type: 'kohe_shtese_provim', description: '' });
      loadIeps();
    }
    setSubmitting(false);
  };

  const openNewIep = () => {
    setError('');
    setEditingIep(null);
    setIepForm({
      student_id: '',
      title: '',
      description: '',
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      status: 'draft',
    });
    setShowIepModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
          <Heart className="w-5 h-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NVA & PIA</h1>
          <p className="text-slate-500 text-sm">Arsimi Gjithëpërfshirës — Ligji 04/L-032, Neni 40</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('needs')}
          className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors ${
            tab === 'needs' ? 'border-pink-500 text-pink-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Nevojat e Veçanta ({needs.length})
        </button>
        <button
          onClick={() => setTab('ieps')}
          className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors ${
            tab === 'ieps' ? 'border-pink-500 text-pink-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Planet Individuale (PIA) ({ieps.length})
        </button>
      </div>

      {tab === 'needs' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNewNeed}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              Shto NVA
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {needs.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                Asnjë nxënës me NVA i regjistruar.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                    <th className="px-4 py-3">Nxënësi</th>
                    <th className="px-4 py-3">Kategoria</th>
                    <th className="px-4 py-3">Niveli</th>
                    <th className="px-4 py-3">Diagnoza</th>
                    <th className="px-4 py-3">Statusi</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {needs.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{n.student_name}</td>
                      <td className="px-4 py-3 text-slate-700">{SPECIAL_NEED_LABELS[n.category]}</td>
                      <td className="px-4 py-3 text-slate-600">{n.severity ? SEVERITY_LABELS[n.severity] : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{n.diagnosis || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${n.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {n.is_active ? 'Aktiv' : 'Joaktiv'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEditNeed(n)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === 'ieps' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNewIep}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              Shto PIA
            </button>
          </div>
          <div className="space-y-3">
            {ieps.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
                Asnjë Plan Individual i Arsimimit.
              </div>
            ) : (
              ieps.map((iep) => (
                <div key={iep.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{iep.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          iep.status === 'aktiv' ? 'bg-emerald-100 text-emerald-700' :
                          iep.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                          iep.status === 'pezulluar' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {IEP_STATUS_LABELS[iep.status]}
                        </span>
                        {iep.parent_consent ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Pëlqimi i prindit
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pa pëlqim prindi
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Për: <span className="font-medium text-slate-700">{iep.student_name}</span> · {iep.start_date}{iep.end_date ? ` → ${iep.end_date}` : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {iep.goals?.length || 0} objektiva · {iep.accommodations?.length || 0} akomodime
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedIep(expandedIep === iep.id ? null : iep.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700"
                    >
                      {expandedIep === iep.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                  {expandedIep === iep.id && (
                    <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
                      {iep.description && <p className="text-sm text-slate-700">{iep.description}</p>}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Objektivat
                          </h4>
                          <button
                            onClick={() => setShowGoalModal(iep.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Shto objektiv
                          </button>
                        </div>
                        {iep.goals && iep.goals.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {iep.goals.map((g) => (
                              <li key={g.id} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium shrink-0">
                                  {IEP_GOAL_AREA_LABELS[g.goal_area]}
                                </span>
                                <span className="flex-1 text-slate-700">{g.description}</span>
                                <span className="text-xs text-slate-500 shrink-0">{IEP_GOAL_STATUS_LABELS[g.status]}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Asnjë objektiv.</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            Akomodime
                          </h4>
                          <button
                            onClick={() => setShowAccModal(iep.id)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            + Shto akomodim
                          </button>
                        </div>
                        {iep.accommodations && iep.accommodations.length > 0 ? (
                          <ul className="space-y-1 text-sm">
                            {iep.accommodations.map((a) => (
                              <li key={a.id} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2">
                                <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium shrink-0">
                                  {IEP_ACCOMMODATION_LABELS[a.accommodation_type]}
                                </span>
                                <span className="flex-1 text-slate-700">{a.description}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Asnjë akomodim.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: NEW/EDIT NEED */}
      {showNeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingNeed ? 'Edito NVA' : 'Shto NVA'}</h2>
              <button onClick={() => setShowNeedModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitNeed} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nxënësi *</label>
                <select required value={needForm.student_id} onChange={(e) => setNeedForm({ ...needForm, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" disabled={!!editingNeed}>
                  <option value="">— Zgjidh —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} {s.class_name ? `(${s.class_name})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
                <select required value={needForm.category} onChange={(e) => setNeedForm({ ...needForm, category: e.target.value as SpecialNeedCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500">
                  {(Object.keys(SPECIAL_NEED_LABELS) as SpecialNeedCategory[]).map((c) => <option key={c} value={c}>{SPECIAL_NEED_LABELS[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveli</label>
                <select value={needForm.severity} onChange={(e) => setNeedForm({ ...needForm, severity: e.target.value as SpecialNeedSeverity | '' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="">— Pa specifikim —</option>
                  {(Object.keys(SEVERITY_LABELS) as SpecialNeedSeverity[]).map((s) => <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnoza</label>
                <textarea rows={2} value={needForm.diagnosis} onChange={(e) => setNeedForm({ ...needForm, diagnosis: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e diagnozës</label>
                  <input type="date" value={needForm.diagnosed_at} onChange={(e) => setNeedForm({ ...needForm, diagnosed_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Diagnostikuar nga</label>
                  <input type="text" value={needForm.diagnosed_by} onChange={(e) => setNeedForm({ ...needForm, diagnosed_by: e.target.value })} placeholder="Dr. Emri / Klinika" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shënime</label>
                <textarea rows={2} value={needForm.notes} onChange={(e) => setNeedForm({ ...needForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowNeedModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW IEP */}
      {showIepModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Plan i Ri Individual (PIA)</h2>
              <button onClick={() => setShowIepModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitIep} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nxënësi *</label>
                <select required value={iepForm.student_id} onChange={(e) => setIepForm({ ...iepForm, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="">— Zgjidh —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} {s.class_name ? `(${s.class_name})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={iepForm.title} onChange={(e) => setIepForm({ ...iepForm, title: e.target.value })} placeholder="P.sh. PIA për 2026-2027" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi i përgjithshëm</label>
                <textarea rows={3} value={iepForm.description} onChange={(e) => setIepForm({ ...iepForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fillimi *</label>
                  <input required type="date" value={iepForm.start_date} onChange={(e) => setIepForm({ ...iepForm, start_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mbarimi</label>
                  <input type="date" value={iepForm.end_date} onChange={(e) => setIepForm({ ...iepForm, end_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                <select value={iepForm.status} onChange={(e) => setIepForm({ ...iepForm, status: e.target.value as IEPStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500">
                  {(Object.keys(IEP_STATUS_LABELS) as IEPStatus[]).map((s) => <option key={s} value={s}>{IEP_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowIepModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Krijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW GOAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Objektiv i Ri</h2>
              <button onClick={() => setShowGoalModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={submitGoal} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fusha *</label>
                <select value={goalForm.goal_area} onChange={(e) => setGoalForm({ ...goalForm, goal_area: e.target.value as IEPGoalArea })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                  {(Object.keys(IEP_GOAL_AREA_LABELS) as IEPGoalArea[]).map((a) => <option key={a} value={a}>{IEP_GOAL_AREA_LABELS[a]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi i objektivit *</label>
                <textarea required rows={3} value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kriteret e arritjes</label>
                <textarea rows={2} value={goalForm.achievement_criteria} onChange={(e) => setGoalForm({ ...goalForm, achievement_criteria: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data e synuar</label>
                  <input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                  <select value={goalForm.status} onChange={(e) => setGoalForm({ ...goalForm, status: e.target.value as IEPGoalStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {(Object.keys(IEP_GOAL_STATUS_LABELS) as IEPGoalStatus[]).map((s) => <option key={s} value={s}>{IEP_GOAL_STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGoalModal(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Shto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW ACCOMMODATION */}
      {showAccModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Akomodim i Ri</h2>
              <button onClick={() => setShowAccModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={submitAccommodation} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lloji i akomodimit *</label>
                <select value={accForm.accommodation_type} onChange={(e) => setAccForm({ ...accForm, accommodation_type: e.target.value as IEPAccommodationType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                  {(Object.keys(IEP_ACCOMMODATION_LABELS) as IEPAccommodationType[]).map((a) => <option key={a} value={a}>{IEP_ACCOMMODATION_LABELS[a]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi *</label>
                <textarea required rows={3} value={accForm.description} onChange={(e) => setAccForm({ ...accForm, description: e.target.value })} placeholder="P.sh. Kohë shtesë 25% në provime me shkrim" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAccModal(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Shto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
