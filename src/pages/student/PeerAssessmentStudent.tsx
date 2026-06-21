import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Users2, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { useToast } from '../../components/ToastProvider';
import type { PeerAssessmentSession } from '../../types/database';

type SessionRow = PeerAssessmentSession & { subject_name: string };
interface Peer { id: string; full_name: string; }

export default function PeerAssessmentStudent() {
  const { profile, isDemo } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peersLoading, setPeersLoading] = useState(false);
  const [myRatings, setMyRatings] = useState<Map<string, { score: number; comment: string }>>(new Map());

  useEffect(() => {
    if (profile?.id || isDemo) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, isDemo]);

  const load = async () => {
    setLoading(true);
    if (isDemo) {
      setSessions([{ id: 'ps1', class_id: 'c1', subject_id: 's1', teacher_id: 'demo', title: 'Puna në grup: Ekosistemet', description: 'Vlerësoni kontributin e secilit.', is_open: true, created_at: new Date().toISOString(), subject_name: 'Biologji' }]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('peer_assessment_sessions')
      .select('*, subjects(name)')
      .eq('is_open', true)
      .order('created_at', { ascending: false });
    type Row = PeerAssessmentSession & { subjects: { name: string } | { name: string }[] | null };
    setSessions(((data as unknown as Row[]) || []).map((s) => {
      const subj = Array.isArray(s.subjects) ? s.subjects[0] : s.subjects;
      return { ...s, subject_name: subj?.name || '' };
    }));
    setLoading(false);
  };

  const openSession = async (s: SessionRow) => {
    if (expanded === s.id) { setExpanded(null); return; }
    setExpanded(s.id);
    setPeersLoading(true);
    if (isDemo) {
      setPeers([{ id: 'p2', full_name: 'Nora Cela' }, { id: 'p3', full_name: 'Liridon Berisha' }]);
      setMyRatings(new Map());
      setPeersLoading(false);
      return;
    }
    const { data: classmates } = await supabase.rpc('peer_session_students', { p_session: s.id });
    const list: Peer[] = ((classmates as Peer[]) || []).filter((p) => p.id !== profile?.id);
    setPeers(list);
    const { data: mine } = await supabase
      .from('peer_assessments')
      .select('assessed_id, score, comment')
      .eq('session_id', s.id)
      .eq('assessor_id', profile?.id || '');
    const m = new Map<string, { score: number; comment: string }>();
    (mine || []).forEach((r: { assessed_id: string; score: number; comment: string }) => m.set(r.assessed_id, { score: r.score, comment: r.comment || '' }));
    setMyRatings(m);
    setPeersLoading(false);
  };

  const saveRating = async (s: SessionRow, peerId: string, score: number, comment: string) => {
    const prev = myRatings.get(peerId);
    setMyRatings((m) => new Map(m).set(peerId, { score, comment }));
    if (isDemo) return;
    if (!profile) return;
    const { error } = await supabase.from('peer_assessments').upsert({
      session_id: s.id, assessor_id: profile.id, assessed_id: peerId, score, comment, updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,assessor_id,assessed_id' });
    if (error) {
      setMyRatings((m) => {
        const next = new Map(m);
        if (prev) next.set(peerId, prev); else next.delete(peerId);
        return next;
      });
      toast.error(error.message);
    } else {
      toast.success(t('pa.rating_saved'));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-cyan-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
          <Users2 className="w-5 h-5 text-cyan-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('pa.student_title')}</h1>
          <p className="text-slate-500 text-sm">{t('pa.student_subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
        <Info className="w-4 h-4 shrink-0" />
        {t('pa.anonymity_notice')}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">{t('pa.student_none')}</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <button onClick={() => openSession(s)} className="w-full px-5 py-4 flex items-start justify-between gap-3 text-left">
                <div className="flex-1">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-700">{s.subject_name}</span>
                  <h3 className="font-semibold text-slate-900 mt-1">{s.title}</h3>
                  {s.description && <p className="text-sm text-slate-600 mt-0.5">{s.description}</p>}
                </div>
                {expanded === s.id ? <ChevronDown className="w-4 h-4 text-slate-400 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />}
              </button>
              {expanded === s.id && (
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 space-y-2">
                  {peersLoading ? (
                    <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                  ) : peers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">{t('pa.no_peers')}</p>
                  ) : (
                    peers.map((p) => {
                      const r = myRatings.get(p.id);
                      return (
                        <div key={p.id} className="bg-white rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-medium text-slate-800 text-sm">{p.full_name}</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => saveRating(s, p.id, n, r?.comment || '')}
                                  className={`w-7 h-7 rounded-lg text-sm font-medium border ${r?.score === n ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                          {r && (
                            <input
                              type="text"
                              defaultValue={r.comment}
                              placeholder={t('pa.comment_placeholder')}
                              onBlur={(e) => { if (e.target.value !== r.comment) saveRating(s, p.id, r.score, e.target.value); }}
                              className="mt-2 w-full px-2 py-1 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
