import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import { Loader2, Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import {
  DELETION_REQUEST_STATUS_LABELS,
  type DataDeletionRequest,
  type DeletionRequestStatus,
} from '../../types/database';

interface RequestRow extends DataDeletionRequest {
  requester_name?: string;
  student_name?: string;
}

const STATUS_COLORS: Record<DeletionRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function DeletionRequests() {
  const { profile } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<RequestRow | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeletionRequestStatus | 'all'>('pending');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .order('created_at', { ascending: false });
    const items: DataDeletionRequest[] = data || [];
    if (items.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const userIds = Array.from(new Set(items.flatMap((r) => [r.requested_by, r.student_id])));
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    const nameMap = new Map((profilesData || []).map((p) => [p.id, p.full_name]));
    setRequests(
      items.map((r) => ({
        ...r,
        requester_name: nameMap.get(r.requested_by) || '—',
        student_name: nameMap.get(r.student_id) || '—',
      })),
    );
    setLoading(false);
  };

  const openReview = (req: RequestRow, action: 'approved' | 'rejected') => {
    setReviewing(req);
    setReviewAction(action);
    setReviewNotes('');
  };

  const submitReview = async () => {
    if (!reviewing || !profile) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({
        status: reviewAction,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq('id', reviewing.id);
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'update',
        resourceType: 'data_deletion_request',
        resourceId: reviewing.id,
        targetUserId: reviewing.student_id,
        metadata: { status: reviewAction, notes: reviewNotes },
      });
      setReviewing(null);
      loadRequests();
    }
    setSubmitting(false);
  };

  const completeRequest = async (req: RequestRow) => {
    if (!profile) return;
    if (!confirm(
      `Anonimizo përfundimisht të dhënat personale të ${req.student_name}?\n\n` +
      `Identiteti (emri, numri personal, datëlindja, kontaktet, të dhënat shëndetësore) fshihet.\n` +
      `Notat dhe Amza ruhen sipas detyrimit ligjor. Ky veprim NUK mund të kthehet.`
    )) return;
    setCompleting(req.id);
    const { error: rpcErr } = await supabase.rpc('anonymize_student', { p_student: req.student_id });
    if (rpcErr) {
      toast.error('Gabim: ' + rpcErr.message);
      setCompleting(null);
      return;
    }
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', req.id);
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'delete',
        resourceType: 'data_deletion_request',
        resourceId: req.id,
        targetUserId: req.student_id,
        metadata: { action: 'anonymized' },
      });
      toast.success('Të dhënat personale u anonimizuan.');
      loadRequests();
    }
    setCompleting(null);
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('dr.title')}</h1>
          <p className="text-slate-500 text-sm">{t('dr.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'completed', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === 'all' ? 'Të gjitha' : DELETION_REQUEST_STATUS_LABELS[s as DeletionRequestStatus]}
            {filter !== s && ` (${requests.filter((r) => s === 'all' || r.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            Asnjë kërkesë në këtë kategori.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                        {DELETION_REQUEST_STATUS_LABELS[r.status]}
                      </span>
                      <p className="text-sm text-slate-500">
                        Paraqitur më {new Date(r.created_at).toLocaleDateString('sq-AL')}
                      </p>
                    </div>
                    <p className="font-medium text-slate-900 mt-2">
                      Për: <span className="text-slate-700">{r.student_name}</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Kërkues: {r.requester_name}
                    </p>
                    <p className="text-sm text-slate-700 mt-2 bg-slate-50 rounded-lg px-3 py-2">
                      {r.reason}
                    </p>
                    {r.review_notes && (
                      <p className="text-xs text-slate-500 italic mt-2">
                        Shënime nga rishikimi: {r.review_notes}
                      </p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => openReview(r, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium"
                      >
                        <Check className="w-4 h-4" />
                        Mirato
                      </button>
                      <button
                        onClick={() => openReview(r, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium"
                      >
                        <X className="w-4 h-4" />
                        Refuzo
                      </button>
                    </div>
                  )}
                  {r.status === 'approved' && (
                    <button
                      onClick={() => completeRequest(r)}
                      disabled={completing === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
                    >
                      {completing === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Përfundo & anonimizo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-5 h-5 ${reviewAction === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <h2 className="text-lg font-bold text-slate-900">
                {reviewAction === 'approved' ? 'Mirato Kërkesën' : 'Refuzo Kërkesën'}
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {reviewAction === 'approved'
                ? 'Të dhënat e jo-detyrueshme do të mund të fshihen pas miratimit. Të dhënat me detyrim ligjor (Amza, dëftesat) mbeten të ruajtura.'
                : 'Shpjegoni arsyen e refuzimit. Prindi do ta marrë këtë shpjegim.'}
            </p>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Shënime për prindin..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
              >
                Anulo
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                className={`flex-1 px-4 py-2 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
                  reviewAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Konfirmo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
