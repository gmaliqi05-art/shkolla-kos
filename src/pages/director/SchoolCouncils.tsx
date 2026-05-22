import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  COUNCIL_TYPE_LABELS,
  COUNCIL_TYPE_DESCRIPTIONS,
  COUNCIL_MEMBER_ROLE_LABELS,
  MEETING_STATUS_LABELS,
  type CouncilType,
  type CouncilMemberRole,
  type MeetingStatus,
  type SchoolCouncil,
  type CouncilMember,
  type CouncilMeeting,
  type MeetingMinutes,
} from '../../types/database';
import {
  Loader2, Plus, X, Users, Calendar, FileText, Check, Edit2, ChevronRight, ChevronDown, UserCog, Briefcase,
} from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

type Tab = 'councils' | 'meetings' | 'minutes';

interface MemberWithProfile extends CouncilMember {
  full_name?: string;
  user_role?: string;
}

interface MeetingWithCouncil extends CouncilMeeting {
  council_name?: string;
  council_type?: CouncilType;
}

const COUNCIL_TYPE_COLORS: Record<CouncilType, string> = {
  drejtues: 'bg-blue-100 text-blue-700 border-blue-200',
  prinder: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  nxenes: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  profesional: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function SchoolCouncils() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('councils');
  const [councils, setCouncils] = useState<SchoolCouncil[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [meetings, setMeetings] = useState<MeetingWithCouncil[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinutes[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Council modal
  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [editingCouncil, setEditingCouncil] = useState<SchoolCouncil | null>(null);
  const [councilForm, setCouncilForm] = useState({
    type: 'drejtues' as CouncilType,
    name: '',
    description: '',
    established_at: '',
    term_ends: '',
  });

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({
    user_id: '',
    role: 'anetar' as CouncilMemberRole,
    represents: '',
  });

  // Meeting modal
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<CouncilMeeting | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    council_id: '',
    title: '',
    meeting_date: new Date().toISOString().slice(0, 10),
    start_time: '14:00',
    end_time: '16:00',
    location: '',
    agenda: '',
    status: 'planifikuar' as MeetingStatus,
  });

  // Minutes modal
  const [showMinutesModal, setShowMinutesModal] = useState<string | null>(null);
  const [minutesForm, setMinutesForm] = useState({
    content: '',
    decisions: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadCouncils(), loadMembers(), loadMeetings(), loadMinutes(), loadUsers()]);
    setLoading(false);
  };

  const loadCouncils = async () => {
    const { data } = await supabase
      .from('school_councils')
      .select('*')
      .order('type');
    setCouncils(data || []);
  };

  const loadMembers = async () => {
    const { data } = await supabase
      .from('council_members')
      .select('*')
      .eq('is_active', true);
    const items: CouncilMember[] = data || [];
    if (items.length === 0) {
      setMembers([]);
      return;
    }
    const userIds = Array.from(new Set(items.map((m) => m.user_id)));
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, role').in('id', userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, { full_name: p.full_name, role: p.role }]));
    setMembers(items.map((m) => ({
      ...m,
      full_name: profileMap.get(m.user_id)?.full_name || '—',
      user_role: profileMap.get(m.user_id)?.role || '—',
    })));
  };

  const loadMeetings = async () => {
    const { data } = await supabase
      .from('council_meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(100);
    const items: CouncilMeeting[] = data || [];
    if (items.length === 0) {
      setMeetings([]);
      return;
    }
    const councilIds = Array.from(new Set(items.map((m) => m.council_id)));
    const { data: councilsData } = await supabase.from('school_councils').select('id, name, type').in('id', councilIds);
    const cMap = new Map((councilsData || []).map((c) => [c.id, c]));
    setMeetings(items.map((m) => {
      const c = cMap.get(m.council_id);
      return { ...m, council_name: c?.name, council_type: c?.type as CouncilType };
    }));
  };

  const loadMinutes = async () => {
    const { data } = await supabase
      .from('meeting_minutes')
      .select('*')
      .order('created_at', { ascending: false });
    setMinutes(data || []);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .is('deleted_at', null)
      .order('full_name');
    setUsers(data || []);
  };

  // ===== COUNCIL =====
  const openNewCouncil = () => {
    setEditingCouncil(null);
    setCouncilForm({ type: 'drejtues', name: '', description: '', established_at: '', term_ends: '' });
    setError('');
    setShowCouncilModal(true);
  };

  const openEditCouncil = (c: SchoolCouncil) => {
    setEditingCouncil(c);
    setCouncilForm({
      type: c.type,
      name: c.name,
      description: c.description,
      established_at: c.established_at || '',
      term_ends: c.term_ends || '',
    });
    setError('');
    setShowCouncilModal(true);
  };

  const submitCouncil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      type: councilForm.type,
      name: councilForm.name,
      description: councilForm.description,
      established_at: councilForm.established_at || null,
      term_ends: councilForm.term_ends || null,
    };
    const res = editingCouncil
      ? await supabase.from('school_councils').update(payload).eq('id', editingCouncil.id)
      : await supabase.from('school_councils').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowCouncilModal(false);
      loadCouncils();
    }
    setSubmitting(false);
  };

  // ===== MEMBER =====
  const submitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMemberModal) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('council_members').insert({
      council_id: showMemberModal,
      user_id: memberForm.user_id,
      role: memberForm.role,
      represents: memberForm.represents,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowMemberModal(null);
      setMemberForm({ user_id: '', role: 'anetar', represents: '' });
      loadMembers();
    }
    setSubmitting(false);
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Largo këtë anëtar nga këshilli?')) return;
    await supabase.from('council_members').update({ is_active: false, left_at: new Date().toISOString().slice(0, 10) }).eq('id', memberId);
    loadMembers();
  };

  // ===== MEETING =====
  const openNewMeeting = () => {
    setEditingMeeting(null);
    setMeetingForm({
      council_id: councils[0]?.id || '',
      title: '',
      meeting_date: new Date().toISOString().slice(0, 10),
      start_time: '14:00',
      end_time: '16:00',
      location: '',
      agenda: '',
      status: 'planifikuar',
    });
    setError('');
    setShowMeetingModal(true);
  };

  const submitMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      council_id: meetingForm.council_id,
      title: meetingForm.title,
      meeting_date: meetingForm.meeting_date,
      start_time: meetingForm.start_time || null,
      end_time: meetingForm.end_time || null,
      location: meetingForm.location,
      agenda: meetingForm.agenda,
      status: meetingForm.status,
      created_by: profile.id,
    };
    const res = editingMeeting
      ? await supabase.from('council_meetings').update({ ...payload, created_by: undefined }).eq('id', editingMeeting.id)
      : await supabase.from('council_meetings').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowMeetingModal(false);
      loadMeetings();
    }
    setSubmitting(false);
  };

  // ===== MINUTES =====
  const openMinutes = (meetingId: string) => {
    const existing = minutes.find((m) => m.meeting_id === meetingId);
    setMinutesForm({
      content: existing?.content || '',
      decisions: existing?.decisions || '',
    });
    setShowMinutesModal(meetingId);
    setError('');
  };

  const submitMinutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMinutesModal || !profile) return;
    setSubmitting(true);
    setError('');
    const existing = minutes.find((m) => m.meeting_id === showMinutesModal);
    const payload = {
      meeting_id: showMinutesModal,
      content: minutesForm.content,
      decisions: minutesForm.decisions,
      recorded_by: profile.id,
    };
    const res = existing
      ? await supabase.from('meeting_minutes').update({ content: minutesForm.content, decisions: minutesForm.decisions, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('meeting_minutes').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowMinutesModal(null);
      loadMinutes();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const membersByCouncil = new Map<string, MemberWithProfile[]>();
  members.forEach((m) => {
    const list = membersByCouncil.get(m.council_id) || [];
    list.push(m);
    membersByCouncil.set(m.council_id, list);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('scc.title')}</h1>
          <p className="text-slate-500 text-sm">{t('scc.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: 'councils', label: 'Këshillat', icon: Briefcase, count: councils.length },
          { key: 'meetings', label: 'Mbledhjet', icon: Calendar, count: meetings.length },
          { key: 'minutes', label: 'Procesverbalet', icon: FileText, count: minutes.length },
        ] as { key: Tab; label: string; icon: typeof Briefcase; count: number }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
              tab === t.key ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'councils' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNewCouncil}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              Shto Këshill
            </button>
          </div>

          <div className="space-y-3">
            {councils.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
                Asnjë këshill i krijuar. Krijo të 4 këshillat sipas Ligjit 04/L-032.
              </div>
            ) : (
              councils.map((c) => {
                const cMembers = membersByCouncil.get(c.id) || [];
                const isOpen = expanded === c.id;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${COUNCIL_TYPE_COLORS[c.type]}`}>
                            {COUNCIL_TYPE_LABELS[c.type]}
                          </span>
                          {!c.is_active && (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">Joaktiv</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-slate-900 mt-1">{c.name}</h3>
                        {c.description && <p className="text-sm text-slate-600 mt-1">{c.description}</p>}
                        <p className="text-xs text-slate-500 mt-2">
                          {cMembers.length} anëtarë
                          {c.term_ends ? ` · mandati deri ${c.term_ends}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditCouncil(c)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setExpanded(isOpen ? null : c.id)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Anëtarët
                          </h4>
                          <button
                            onClick={() => { setShowMemberModal(c.id); setMemberForm({ user_id: '', role: 'anetar', represents: '' }); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            + Shto anëtar
                          </button>
                        </div>
                        {cMembers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Asnjë anëtar.</p>
                        ) : (
                          <ul className="space-y-1">
                            {cMembers.map((m) => (
                              <li key={m.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
                                <UserCog className="w-4 h-4 text-slate-400" />
                                <span className="font-medium text-slate-900">{m.full_name}</span>
                                <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                                  {COUNCIL_MEMBER_ROLE_LABELS[m.role]}
                                </span>
                                {m.represents && <span className="text-xs text-slate-500">· {m.represents}</span>}
                                <button onClick={() => removeMember(m.id)} className="ml-auto text-xs text-rose-600 hover:text-rose-800">
                                  Largo
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'meetings' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={openNewMeeting}
              disabled={councils.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Shto Mbledhje
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {meetings.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">Asnjë mbledhje e regjistruar.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {meetings.map((m) => {
                  const hasMinutes = minutes.some((mn) => mn.meeting_id === m.id);
                  return (
                    <div key={m.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {m.council_type && (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${COUNCIL_TYPE_COLORS[m.council_type]}`}>
                                {COUNCIL_TYPE_LABELS[m.council_type]}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              m.status === 'mbajtur' ? 'bg-emerald-100 text-emerald-700' :
                              m.status === 'planifikuar' ? 'bg-blue-100 text-blue-700' :
                              m.status === 'anuluar' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {MEETING_STATUS_LABELS[m.status]}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 mt-1">{m.title}</h3>
                          <p className="text-sm text-slate-500 mt-0.5">
                            {m.meeting_date}
                            {m.start_time && ` · ${m.start_time.slice(0, 5)}${m.end_time ? `–${m.end_time.slice(0, 5)}` : ''}`}
                            {m.location && ` · ${m.location}`}
                          </p>
                          {m.agenda && <p className="text-sm text-slate-700 mt-2 italic">{m.agenda}</p>}
                        </div>
                        <button
                          onClick={() => openMinutes(m.id)}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                            hasMinutes ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          {hasMinutes ? 'Edito procesverbalin' : 'Shto procesverbal'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'minutes' && (
        <div className="space-y-3">
          {minutes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
              Asnjë procesverbal i regjistruar.
            </div>
          ) : (
            minutes.map((mn) => {
              const meeting = meetings.find((m) => m.id === mn.meeting_id);
              return (
                <div key={mn.id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">
                        {meeting?.title || 'Mbledhje e fshirë'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {meeting?.meeting_date} · {meeting?.council_type && COUNCIL_TYPE_LABELS[meeting.council_type]}
                      </p>
                      <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{mn.content}</p>
                      {mn.decisions && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Vendimet:</p>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap">{mn.decisions}</p>
                        </div>
                      )}
                    </div>
                    {mn.approved && (
                      <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        <Check className="w-3 h-3" />
                        I miratuar
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===== COUNCIL MODAL ===== */}
      {showCouncilModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingCouncil ? 'Edito Këshillin' : 'Krijo Këshill'}</h2>
              <button onClick={() => setShowCouncilModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitCouncil} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lloji *</label>
                <select
                  required
                  value={councilForm.type}
                  onChange={(e) => setCouncilForm({ ...councilForm, type: e.target.value as CouncilType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingCouncil}
                >
                  {(Object.keys(COUNCIL_TYPE_LABELS) as CouncilType[]).map((t) => (
                    <option key={t} value={t}>{COUNCIL_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">{COUNCIL_TYPE_DESCRIPTIONS[councilForm.type]}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri *</label>
                <input
                  required
                  type="text"
                  value={councilForm.name}
                  onChange={(e) => setCouncilForm({ ...councilForm, name: e.target.value })}
                  placeholder="P.sh. Këshilli Drejtues 2026-2027"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea
                  rows={2}
                  value={councilForm.description}
                  onChange={(e) => setCouncilForm({ ...councilForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Themeluar më</label>
                  <input type="date" value={councilForm.established_at} onChange={(e) => setCouncilForm({ ...councilForm, established_at: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mandati skadon</label>
                  <input type="date" value={councilForm.term_ends} onChange={(e) => setCouncilForm({ ...councilForm, term_ends: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowCouncilModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MEMBER MODAL ===== */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Shto Anëtar</h2>
              <button onClick={() => setShowMemberModal(null)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitMember} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përdoruesi *</label>
                <select
                  required
                  value={memberForm.user_id}
                  onChange={(e) => setMemberForm({ ...memberForm, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Zgjidh —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roli *</label>
                <select
                  required
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as CouncilMemberRole })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {(Object.keys(COUNCIL_MEMBER_ROLE_LABELS) as CouncilMemberRole[]).map((r) => (
                    <option key={r} value={r}>{COUNCIL_MEMBER_ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përfaqëson</label>
                <input
                  type="text"
                  value={memberForm.represents}
                  onChange={(e) => setMemberForm({ ...memberForm, represents: e.target.value })}
                  placeholder="P.sh. Klasa 5-A, Komuna, MAShTI"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMemberModal(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Shto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MEETING MODAL ===== */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editingMeeting ? 'Edito Mbledhjen' : 'Mbledhje e Re'}</h2>
              <button onClick={() => setShowMeetingModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitMeeting} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Këshilli *</label>
                <select
                  required
                  value={meetingForm.council_id}
                  onChange={(e) => setMeetingForm({ ...meetingForm, council_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Zgjidh —</option>
                  {councils.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({COUNCIL_TYPE_LABELS[c.type]})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                  <input required type="date" value={meetingForm.meeting_date} onChange={(e) => setMeetingForm({ ...meetingForm, meeting_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nga</label>
                  <input type="time" value={meetingForm.start_time} onChange={(e) => setMeetingForm({ ...meetingForm, start_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deri</label>
                  <input type="time" value={meetingForm.end_time} onChange={(e) => setMeetingForm({ ...meetingForm, end_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendi</label>
                <input type="text" value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Salla e konferencave" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agjenda</label>
                <textarea rows={3} value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="1. ...\n2. ..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Statusi</label>
                <select value={meetingForm.status} onChange={(e) => setMeetingForm({ ...meetingForm, status: e.target.value as MeetingStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                  {(Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]).map((s) => (
                    <option key={s} value={s}>{MEETING_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMeetingModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MINUTES MODAL ===== */}
      {showMinutesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Procesverbali</h2>
              <button onClick={() => setShowMinutesModal(null)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submitMinutes} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përmbajtja *</label>
                <textarea required rows={8} value={minutesForm.content} onChange={(e) => setMinutesForm({ ...minutesForm, content: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Përshkrimi i diskutimeve, prezenca, etj." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendimet e marra</label>
                <textarea rows={4} value={minutesForm.decisions} onChange={(e) => setMinutesForm({ ...minutesForm, decisions: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="1. ...\n2. ..." />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowMinutesModal(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj Procesverbalin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
