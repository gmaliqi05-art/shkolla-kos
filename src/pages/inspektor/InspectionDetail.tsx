import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  INSPECTION_TYPE_LABELS,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_COLORS,
  OVERALL_RATING_LABELS,
  OVERALL_RATING_COLORS,
  FINDING_CATEGORY_LABELS,
  FINDING_SEVERITY_LABELS,
  FINDING_SEVERITY_COLORS,
  REC_PRIORITY_LABELS,
  REC_PRIORITY_COLORS,
  REC_STATUS_LABELS,
  type Inspection,
  type InspectionFinding,
  type InspectionRecommendation,
  type FindingCategory,
  type FindingSeverity,
  type RecommendationPriority,
  type RecommendationStatus,
} from '../../types/database';
import { Loader2, ArrowLeft, Plus, X, AlertTriangle, Lightbulb, CheckCircle, Edit2, Trash2, Printer } from 'lucide-react';

export default function InspectionDetail() {
  const { id } = useParams();
  const { profile } = useAuth();
  const isInspector = profile?.role === 'inspektor';
  const isDirector = profile?.role === 'drejtor';

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [findings, setFindings] = useState<InspectionFinding[]>([]);
  const [recommendations, setRecommendations] = useState<InspectionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFindingModal, setShowFindingModal] = useState(false);
  const [editingFinding, setEditingFinding] = useState<InspectionFinding | null>(null);
  const [showRecModal, setShowRecModal] = useState(false);
  const [editingRec, setEditingRec] = useState<InspectionRecommendation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [findingForm, setFindingForm] = useState({
    category: 'mesimdhenie' as FindingCategory,
    severity: 'mesatare' as FindingSeverity,
    title: '',
    description: '',
    evidence: '',
    legal_basis: '',
  });

  const [recForm, setRecForm] = useState({
    finding_id: '' as string | '',
    title: '',
    description: '',
    priority: 'mesatar' as RecommendationPriority,
    deadline: '',
    responsible: 'drejtori_shkolles',
    status: 'i_papermbushur' as RecommendationStatus,
    completion_evidence: '',
  });

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    const [inspRes, fRes, rRes] = await Promise.all([
      supabase.from('inspections').select('*').eq('id', id).maybeSingle(),
      supabase.from('inspection_findings').select('*').eq('inspection_id', id).order('created_at'),
      supabase.from('inspection_recommendations').select('*').eq('inspection_id', id).order('created_at'),
    ]);
    setInspection(inspRes.data);
    if (inspRes.data) {
      const { data: school } = await supabase.from('school_info').select('name').eq('id', inspRes.data.school_id).maybeSingle();
      setSchoolName(school?.name || '');
    }
    setFindings(fRes.data || []);
    setRecommendations(rRes.data || []);
    setLoading(false);
  };

  const openNewFinding = () => {
    setEditingFinding(null);
    setFindingForm({ category: 'mesimdhenie', severity: 'mesatare', title: '', description: '', evidence: '', legal_basis: '' });
    setError('');
    setShowFindingModal(true);
  };

  const openEditFinding = (f: InspectionFinding) => {
    setEditingFinding(f);
    setFindingForm({
      category: f.category,
      severity: f.severity,
      title: f.title,
      description: f.description,
      evidence: f.evidence,
      legal_basis: f.legal_basis,
    });
    setError('');
    setShowFindingModal(true);
  };

  const submitFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError('');
    const payload = { inspection_id: id, ...findingForm };
    const res = editingFinding
      ? await supabase.from('inspection_findings').update(payload).eq('id', editingFinding.id)
      : await supabase.from('inspection_findings').insert(payload);
    if (res.error) setError(res.error.message);
    else { setShowFindingModal(false); load(); }
    setSubmitting(false);
  };

  const removeFinding = async (fid: string) => {
    if (!confirm('Fshij këtë gjetje?')) return;
    await supabase.from('inspection_findings').delete().eq('id', fid);
    load();
  };

  const openNewRec = () => {
    setEditingRec(null);
    setRecForm({ finding_id: '', title: '', description: '', priority: 'mesatar', deadline: '', responsible: 'drejtori_shkolles', status: 'i_papermbushur', completion_evidence: '' });
    setError('');
    setShowRecModal(true);
  };

  const openEditRec = (r: InspectionRecommendation) => {
    setEditingRec(r);
    setRecForm({
      finding_id: r.finding_id || '',
      title: r.title,
      description: r.description,
      priority: r.priority,
      deadline: r.deadline || '',
      responsible: r.responsible,
      status: r.status,
      completion_evidence: r.completion_evidence,
    });
    setError('');
    setShowRecModal(true);
  };

  const submitRec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !profile) return;
    setSubmitting(true);
    setError('');
    const payload: Record<string, unknown> = {
      inspection_id: id,
      finding_id: recForm.finding_id || null,
      title: recForm.title,
      description: recForm.description,
      priority: recForm.priority,
      deadline: recForm.deadline || null,
      responsible: recForm.responsible,
      status: recForm.status,
      completion_evidence: recForm.completion_evidence,
    };
    if (recForm.status === 'i_permbushur' && (!editingRec || editingRec.status !== 'i_permbushur')) {
      payload.completed_at = new Date().toISOString();
      payload.verified_by = profile.id;
    }
    const res = editingRec
      ? await supabase.from('inspection_recommendations').update(payload).eq('id', editingRec.id)
      : await supabase.from('inspection_recommendations').insert(payload);
    if (res.error) setError(res.error.message);
    else { setShowRecModal(false); load(); }
    setSubmitting(false);
  };

  const removeRec = async (rid: string) => {
    if (!confirm('Fshij këtë rekomandim?')) return;
    await supabase.from('inspection_recommendations').delete().eq('id', rid);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>;
  }

  if (!inspection) {
    return <div className="text-center py-12 text-rose-500">Inspektimi nuk u gjet.</div>;
  }

  const findingsMap = new Map(findings.map((f) => [f.id, f.title]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link to={isInspector ? '/inspektor/inspektimet' : '/drejtor/inspektimet'} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Kthehu te lista
        </Link>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl">
          <Printer className="w-4 h-4" />
          Printo Raportin
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-700 to-amber-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20">
            {INSPECTION_TYPE_LABELS[inspection.inspection_type]}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${INSPECTION_STATUS_COLORS[inspection.status]}`}>
            {INSPECTION_STATUS_LABELS[inspection.status]}
          </span>
          {inspection.overall_rating && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${OVERALL_RATING_COLORS[inspection.overall_rating]}`}>
              ★ {OVERALL_RATING_LABELS[inspection.overall_rating]}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold">Inspektim — {schoolName}</h1>
        <p className="text-orange-100 text-sm mt-1">
          Planifikuar: {inspection.planned_date}
          {inspection.conducted_date && ` · Mbajtur: ${inspection.conducted_date}`}
          {inspection.duration_hours && ` · ${inspection.duration_hours}h`}
        </p>
        {inspection.scope && <p className="text-orange-100 text-sm mt-2 italic">Fokusi: {inspection.scope}</p>}
        {inspection.summary && <p className="text-white text-sm mt-3 leading-relaxed">{inspection.summary}</p>}
      </div>

      {/* FINDINGS */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-slate-900">Gjetjet ({findings.length})</h2>
          </div>
          {isInspector && (
            <button onClick={openNewFinding} className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-3.5 h-3.5" />
              Shto gjetje
            </button>
          )}
        </div>
        {findings.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Asnjë gjetje e regjistruar.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {findings.map((f) => (
              <div key={f.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {FINDING_CATEGORY_LABELS[f.category]}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${FINDING_SEVERITY_COLORS[f.severity]}`}>
                        {FINDING_SEVERITY_LABELS[f.severity]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{f.description}</p>
                    {f.evidence && (
                      <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-slate-600">Dëshmi:</p>
                        <p className="text-sm text-slate-700">{f.evidence}</p>
                      </div>
                    )}
                    {f.legal_basis && (
                      <p className="text-xs text-slate-500 mt-2 italic">Bazë ligjore: {f.legal_basis}</p>
                    )}
                  </div>
                  {isInspector && (
                    <div className="flex gap-1 print:hidden">
                      <button onClick={() => openEditFinding(f)} className="p-1 text-slate-400 hover:text-slate-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeFinding(f.id)} className="p-1 text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDATIONS */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-slate-900">Rekomandimet ({recommendations.length})</h2>
          </div>
          {isInspector && (
            <button onClick={openNewRec} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-3.5 h-3.5" />
              Shto rekomandim
            </button>
          )}
        </div>
        {recommendations.length === 0 ? (
          <div className="px-6 py-8 text-center text-slate-400 text-sm">Asnjë rekomandim.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recommendations.map((r) => {
              const overdue = r.status !== 'i_permbushur' && r.deadline && new Date(r.deadline) < new Date();
              return (
                <div key={r.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${REC_PRIORITY_COLORS[r.priority]}`}>
                          {REC_PRIORITY_LABELS[r.priority]}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'i_permbushur' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {r.status === 'i_permbushur' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {REC_STATUS_LABELS[r.status]}
                        </span>
                        {overdue && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-700">
                            ⚠ I vonuar
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 mt-1.5">{r.title}</h3>
                      <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{r.description}</p>
                      {r.finding_id && findingsMap.get(r.finding_id) && (
                        <p className="text-xs text-slate-500 mt-1">Lidhur me gjetjen: <em>{findingsMap.get(r.finding_id)}</em></p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                        {r.deadline && <span>Afati: {r.deadline}</span>}
                        <span>Përgjegjës: {r.responsible}</span>
                      </div>
                      {r.completion_evidence && (
                        <div className="mt-2 bg-emerald-50 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-emerald-900">Dëshmi përmbushjeje:</p>
                          <p className="text-sm text-emerald-900">{r.completion_evidence}</p>
                        </div>
                      )}
                    </div>
                    {(isInspector || isDirector) && (
                      <div className="flex gap-1 print:hidden">
                        <button onClick={() => openEditRec(r)} className="p-1 text-slate-400 hover:text-slate-700">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isInspector && (
                          <button onClick={() => removeRec(r.id)} className="p-1 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FINDING MODAL */}
      {showFindingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingFinding ? 'Edito Gjetjen' : 'Shto Gjetje'}</h2>
              <button onClick={() => setShowFindingModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitFinding} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
                  <select required value={findingForm.category} onChange={(e) => setFindingForm({ ...findingForm, category: e.target.value as FindingCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    {(Object.keys(FINDING_CATEGORY_LABELS) as FindingCategory[]).map((c) => (
                      <option key={c} value={c}>{FINDING_CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rëndësia *</label>
                  <select required value={findingForm.severity} onChange={(e) => setFindingForm({ ...findingForm, severity: e.target.value as FindingSeverity })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                    {(Object.keys(FINDING_SEVERITY_LABELS) as FindingSeverity[]).map((s) => (
                      <option key={s} value={s}>{FINDING_SEVERITY_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={findingForm.title} onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi *</label>
                <textarea required rows={3} value={findingForm.description} onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dëshmi</label>
                <textarea rows={2} value={findingForm.evidence} onChange={(e) => setFindingForm({ ...findingForm, evidence: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Baza ligjore</label>
                <input type="text" value={findingForm.legal_basis} onChange={(e) => setFindingForm({ ...findingForm, legal_basis: e.target.value })} placeholder="P.sh. Ligji 04/L-032 Neni 20" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowFindingModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REC MODAL */}
      {showRecModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingRec ? 'Edito Rekomandimin' : 'Shto Rekomandim'}</h2>
              <button onClick={() => setShowRecModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitRec} className="space-y-3">
              {findings.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lidhur me gjetjen</label>
                  <select value={recForm.finding_id} onChange={(e) => setRecForm({ ...recForm, finding_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="">— Pa specifikim —</option>
                    {findings.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi *</label>
                <textarea required rows={3} value={recForm.description} onChange={(e) => setRecForm({ ...recForm, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioriteti *</label>
                  <select required value={recForm.priority} onChange={(e) => setRecForm({ ...recForm, priority: e.target.value as RecommendationPriority })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    {(Object.keys(REC_PRIORITY_LABELS) as RecommendationPriority[]).map((p) => (
                      <option key={p} value={p}>{REC_PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                  <select value={recForm.status} onChange={(e) => setRecForm({ ...recForm, status: e.target.value as RecommendationStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    {(Object.keys(REC_STATUS_LABELS) as RecommendationStatus[]).map((s) => (
                      <option key={s} value={s}>{REC_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Afati i përmbushjes</label>
                  <input type="date" value={recForm.deadline} onChange={(e) => setRecForm({ ...recForm, deadline: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Përgjegjësi</label>
                  <select value={recForm.responsible} onChange={(e) => setRecForm({ ...recForm, responsible: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                    <option value="drejtori_shkolles">Drejtori i shkollës</option>
                    <option value="dka">DKA</option>
                    <option value="mashti">MAShTI</option>
                    <option value="komuna">Komuna</option>
                    <option value="tjeter">Tjetër</option>
                  </select>
                </div>
              </div>
              {recForm.status === 'i_permbushur' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dëshmi përmbushjeje</label>
                  <textarea rows={2} value={recForm.completion_evidence} onChange={(e) => setRecForm({ ...recForm, completion_evidence: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                </div>
              )}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowRecModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
