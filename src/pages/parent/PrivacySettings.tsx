import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import {
  CONSENT_TYPE_LABELS,
  CONSENT_TYPE_DESCRIPTIONS,
  DELETION_REQUEST_STATUS_LABELS,
  type ConsentType,
  type Consent,
  type DataDeletionRequest,
} from '../../types/database';
import { Loader2, Check, X, Trash2, Shield, AlertTriangle, FileText } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

const CONSENT_ORDER: ConsentType[] = [
  'data_processing',
  'medical',
  'photo_use',
  'directory',
  'extracurricular',
  'communication',
];

interface ChildOption {
  id: string;
  full_name: string;
}

export default function PrivacySettings() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [consents, setConsents] = useState<Map<ConsentType, Consent>>(new Map());
  const [requests, setRequests] = useState<DataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<ConsentType | null>(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [submittingDeletion, setSubmittingDeletion] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile?.id) loadChildren();
  }, [profile?.id]);

  useEffect(() => {
    if (selectedChild) {
      loadConsents();
      loadRequests();
    }
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
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', ids);
    setChildren(data || []);
    if (data && data.length > 0) setSelectedChild(data[0].id);
    setLoading(false);
  };

  const loadConsents = async () => {
    const { data } = await supabase
      .from('consents')
      .select('*')
      .eq('student_id', selectedChild);
    const map = new Map<ConsentType, Consent>();
    (data || []).forEach((c: Consent) => map.set(c.consent_type, c));
    setConsents(map);
  };

  const loadRequests = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('requested_by', profile.id)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const toggleConsent = async (type: ConsentType, granted: boolean) => {
    if (!profile || !selectedChild) return;
    setSavingType(type);
    setMessage('');
    const existing = consents.get(type);
    if (existing) {
      const { error } = await supabase
        .from('consents')
        .update({
          granted,
          granted_at: granted ? new Date().toISOString() : existing.granted_at,
          revoked_at: granted ? null : new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) {
        setMessage(`${t('parent.iep.error_prefix')} ${error.message}`);
      } else {
        await logAudit({
          actorId: profile.id,
          actorRole: profile.role,
          action: 'update',
          resourceType: 'consent',
          resourceId: existing.id,
          targetUserId: selectedChild,
          metadata: { consent_type: type, granted },
        });
        loadConsents();
      }
    } else {
      const { data, error } = await supabase
        .from('consents')
        .insert({
          student_id: selectedChild,
          granted_by: profile.id,
          consent_type: type,
          granted,
        })
        .select()
        .single();
      if (error) {
        setMessage(`${t('parent.iep.error_prefix')} ${error.message}`);
      } else {
        await logAudit({
          actorId: profile.id,
          actorRole: profile.role,
          action: 'create',
          resourceType: 'consent',
          resourceId: data?.id,
          targetUserId: selectedChild,
          metadata: { consent_type: type, granted },
        });
        loadConsents();
      }
    }
    setSavingType(null);
  };

  const submitDeletionRequest = async () => {
    if (!profile || !selectedChild || !deletionReason.trim()) return;
    setSubmittingDeletion(true);
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .insert({
        requested_by: profile.id,
        student_id: selectedChild,
        reason: deletionReason,
      })
      .select()
      .single();
    if (error) {
      setMessage('Gabim: ' + error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'create',
        resourceType: 'data_deletion_request',
        resourceId: data?.id,
        targetUserId: selectedChild,
      });
      setShowDeletionModal(false);
      setDeletionReason('');
      setMessage(t('parent.priv.deletion_request_sent'));
      loadRequests();
    }
    setSubmittingDeletion(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        {t('parent.privacy.no_children')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('parent.priv.title')}</h1>
          <p className="text-slate-500 text-sm">{t('parent.priv.subtitle')}</p>
        </div>
      </div>

      {children.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('parent.child_label')}</label>
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-xl px-4 py-3">
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-900">{t('parent.priv.consents_section')}</h2>
            <p className="text-xs text-slate-500">{t('parent.priv.can_withdraw')}</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {CONSENT_ORDER.map((type) => {
            const consent = consents.get(type);
            const isGranted = !!consent?.granted;
            const isSaving = savingType === type;
            return (
              <div key={type} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{CONSENT_TYPE_LABELS[type]}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{CONSENT_TYPE_DESCRIPTIONS[type]}</p>
                  {consent && (
                    <p className="text-xs text-slate-400 mt-1">
                      {isGranted
                        ? `${t('parent.priv.given_on')} ${new Date(consent.granted_at).toLocaleDateString('sq-AL')}`
                        : consent.revoked_at
                          ? `${t('parent.priv.withdrawn_on')} ${new Date(consent.revoked_at).toLocaleDateString('sq-AL')}`
                          : t('parent.priv.refused')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleConsent(type, !isGranted)}
                  disabled={isSaving}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                    isGranted
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isGranted ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('parent.priv.granted')}
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      {t('parent.priv.not_granted')}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-rose-100 bg-rose-50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <div>
            <h2 className="font-semibold text-slate-900">{t('parent.priv.right_to_be_forgotten')}</h2>
            <p className="text-xs text-slate-600">{t('parent.priv.deletion_subtitle')}</p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-slate-600">
            {t('parent.priv.deletion_explanation')}
            <strong> {t('parent.priv.deletion_warning')}</strong> {t('parent.priv.deletion_warning_text')}
          </p>

          <button
            onClick={() => setShowDeletionModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t('parent.priv.request_deletion_btn')}
          </button>

          {requests.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{t('parent.priv.previous_requests')}</p>
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {DELETION_REQUEST_STATUS_LABELS[r.status]}
                    </span>
                    <div className="flex-1">
                      <p className="text-slate-700">{r.reason}</p>
                      <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString('sq-AL')}</p>
                      {r.review_notes && <p className="text-xs text-slate-500 italic mt-0.5">{t('parent.priv.response_label')} {r.review_notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeletionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">{t('parent.priv.modal_title')}</h2>
            <p className="text-sm text-slate-600 mb-4">
              {t('parent.priv.modal_help')}
            </p>
            <textarea
              rows={4}
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder={t('parent.priv.modal_placeholder')}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowDeletionModal(false); setDeletionReason(''); }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitDeletionRequest}
                disabled={submittingDeletion || !deletionReason.trim()}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingDeletion && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('parent.priv.send_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
