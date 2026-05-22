import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import {
  IEP_STATUS_LABELS,
  IEP_GOAL_AREA_LABELS,
  IEP_GOAL_STATUS_LABELS,
  IEP_ACCOMMODATION_LABELS,
  SPECIAL_NEED_LABELS,
  SEVERITY_LABELS,
  type IndividualEducationPlan,
  type IEPGoal,
  type IEPAccommodation,
  type SpecialNeed,
} from '../../types/database';
import { Loader2, Heart, Check, Target, Sparkles, FileText, AlertCircle } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface ChildOption {
  id: string;
  full_name: string;
}

interface IEPWithDetails extends IndividualEducationPlan {
  goals?: IEPGoal[];
  accommodations?: IEPAccommodation[];
}

export default function ChildIEP() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [needs, setNeeds] = useState<SpecialNeed[]>([]);
  const [ieps, setIeps] = useState<IEPWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [consentingId, setConsentingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.id) loadChildren();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedChild) loadChildData();
  }, [selectedChild]);

  const loadChildren = async () => {
    if (!profile) return;
    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', profile.id);
    const ids = (links || []).map((l) => l.student_id);
    if (ids.length === 0) {
      setChildren([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
    setChildren(data || []);
    if (data && data.length > 0) setSelectedChild(data[0].id);
    setLoading(false);
  };

  const loadChildData = async () => {
    const [needsRes, iepsRes] = await Promise.all([
      supabase.from('special_needs').select('*').eq('student_id', selectedChild).eq('is_active', true),
      supabase.from('individual_education_plans').select('*').eq('student_id', selectedChild).order('created_at', { ascending: false }),
    ]);
    setNeeds(needsRes.data || []);
    const iepList: IndividualEducationPlan[] = iepsRes.data || [];
    if (iepList.length === 0) {
      setIeps([]);
      return;
    }
    const iepIds = iepList.map((i) => i.id);
    const [goalsRes, accRes] = await Promise.all([
      supabase.from('iep_goals').select('*').in('iep_id', iepIds),
      supabase.from('iep_accommodations').select('*').in('iep_id', iepIds),
    ]);
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
    setIeps(iepList.map((i) => ({
      ...i,
      goals: goalsByIep.get(i.id) || [],
      accommodations: accByIep.get(i.id) || [],
    })));
  };

  const giveConsent = async (iep: IEPWithDetails) => {
    if (!profile) return;
    setConsentingId(iep.id);
    setMessage('');
    const { error } = await supabase
      .from('individual_education_plans')
      .update({
        parent_consent: true,
        parent_consent_at: new Date().toISOString(),
        parent_consent_by: profile.id,
      })
      .eq('id', iep.id);
    if (error) {
      setMessage(`${t('parent.iep.error_prefix')} ${error.message}`);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'update',
        resourceType: 'iep_consent',
        resourceId: iep.id,
        targetUserId: iep.student_id,
      });
      setMessage(t('parent.iep.consent_recorded'));
      loadChildData();
    }
    setConsentingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        {t('parent.privacy.no_children')}
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
          <h1 className="text-2xl font-bold text-slate-900">{t('parent.iep.title')}</h1>
          <p className="text-slate-500 text-sm">{t('parent.iep.subtitle')}</p>
        </div>
      </div>

      {children.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('parent.child_label')}</label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          {message}
        </div>
      )}

      {needs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">{t('parent.iep.special_needs_section')}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {needs.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium text-slate-900">{SPECIAL_NEED_LABELS[n.category]}</p>
                  {n.severity && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700">{SEVERITY_LABELS[n.severity]}</span>
                  )}
                </div>
                {n.diagnosis && <p className="text-sm text-slate-600 mt-1">{n.diagnosis}</p>}
                {n.diagnosed_by && <p className="text-xs text-slate-500 mt-0.5">{t('parent.iep.diagnosed_by')} {n.diagnosed_by}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {ieps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
            {t('parent.iep.no_ieps')}
          </div>
        ) : (
          ieps.map((iep) => (
            <div key={iep.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{iep.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {iep.start_date}{iep.end_date ? ` → ${iep.end_date}` : ''} · {IEP_STATUS_LABELS[iep.status]}
                    </p>
                  </div>
                  {iep.parent_consent ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                      <Check className="w-3 h-3" />
                      {t('parent.iep.consent_given')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                      <AlertCircle className="w-3 h-3" />
                      {t('parent.iep.no_consent')}
                    </span>
                  )}
                </div>
                {iep.description && <p className="text-sm text-slate-700 mt-2">{iep.description}</p>}

                {iep.goals && iep.goals.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      {t('parent.iep.goals_section')}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {iep.goals.map((g) => (
                        <li key={g.id} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 font-medium shrink-0">
                            {IEP_GOAL_AREA_LABELS[g.goal_area]}
                          </span>
                          <span className="flex-1 text-slate-700">{g.description}</span>
                          <span className="text-xs text-slate-500 shrink-0">{IEP_GOAL_STATUS_LABELS[g.status]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {iep.accommodations && iep.accommodations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      {t('parent.iep.accommodations_section')}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {iep.accommodations.map((a) => (
                        <li key={a.id} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium shrink-0">
                            {IEP_ACCOMMODATION_LABELS[a.accommodation_type]}
                          </span>
                          <span className="flex-1 text-slate-700">{a.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!iep.parent_consent && iep.status === 'aktiv' && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-600 mb-3">
                      {t('parent.iep.consent_required_msg')}
                    </p>
                    <button
                      onClick={() => giveConsent(iep)}
                      disabled={consentingId === iep.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50"
                    >
                      {consentingId === iep.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {t('parent.iep.give_consent_btn')}
                    </button>
                  </div>
                )}

                {iep.parent_consent && iep.parent_consent_at && (
                  <p className="text-xs text-slate-500 mt-3">
                    {t('parent.iep.consent_given_on')} {new Date(iep.parent_consent_at).toLocaleDateString('sq-AL')}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
