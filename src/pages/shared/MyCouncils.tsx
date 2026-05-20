import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  COUNCIL_TYPE_LABELS,
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
import { Loader2, Briefcase, Calendar, FileText, Users } from 'lucide-react';

const COUNCIL_TYPE_COLORS: Record<CouncilType, string> = {
  drejtues: 'bg-blue-100 text-blue-700 border-blue-200',
  prinder: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  nxenes: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  profesional: 'bg-purple-100 text-purple-700 border-purple-200',
};

interface MyCouncilEntry {
  council: SchoolCouncil;
  membership: CouncilMember;
  meetings: CouncilMeeting[];
}

export default function MyCouncils() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<MyCouncilEntry[]>([]);
  const [minutes, setMinutes] = useState<Map<string, MeetingMinutes>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile) return;

    const { data: memberships } = await supabase
      .from('council_members')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true);

    const memberList: CouncilMember[] = memberships || [];
    if (memberList.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    const councilIds = memberList.map((m) => m.council_id);
    const { data: councilsData } = await supabase
      .from('school_councils')
      .select('*')
      .in('id', councilIds);
    const cMap = new Map((councilsData || []).map((c: SchoolCouncil) => [c.id, c]));

    const { data: meetingsData } = await supabase
      .from('council_meetings')
      .select('*')
      .in('council_id', councilIds)
      .order('meeting_date', { ascending: false });
    const meetingsList: CouncilMeeting[] = meetingsData || [];
    const meetingsByCouncil = new Map<string, CouncilMeeting[]>();
    meetingsList.forEach((m) => {
      const list = meetingsByCouncil.get(m.council_id) || [];
      list.push(m);
      meetingsByCouncil.set(m.council_id, list);
    });

    const meetingIds = meetingsList.map((m) => m.id);
    if (meetingIds.length > 0) {
      const { data: minutesData } = await supabase
        .from('meeting_minutes')
        .select('*')
        .in('meeting_id', meetingIds);
      const mnMap = new Map<string, MeetingMinutes>();
      (minutesData || []).forEach((mn: MeetingMinutes) => mnMap.set(mn.meeting_id, mn));
      setMinutes(mnMap);
    }

    const built: MyCouncilEntry[] = memberList
      .map((m) => {
        const c = cMap.get(m.council_id);
        if (!c) return null;
        return {
          council: c,
          membership: m,
          meetings: meetingsByCouncil.get(m.council_id) || [],
        };
      })
      .filter((e): e is MyCouncilEntry => e !== null);

    setEntries(built);
    setLoading(false);
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
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Këshillat e Mi</h1>
          <p className="text-slate-500 text-sm">Mbledhjet dhe procesverbalet e këshillave ku jeni anëtar</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-700 font-medium mb-1">Nuk jeni anëtar i ndonjë këshilli aktiv</p>
          <p className="text-slate-400 text-sm">Drejtori i shkollës ju shton si anëtar në këshillin përkatës.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <div key={e.membership.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${COUNCIL_TYPE_COLORS[e.council.type]}`}>
                    {COUNCIL_TYPE_LABELS[e.council.type]}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    <Users className="w-3 h-3 inline mr-1" />
                    {COUNCIL_MEMBER_ROLE_LABELS[e.membership.role as CouncilMemberRole]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 mt-1">{e.council.name}</h3>
                {e.membership.represents && (
                  <p className="text-xs text-slate-500 mt-0.5">Përfaqësues: {e.membership.represents}</p>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {e.meetings.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-slate-400 italic">Asnjë mbledhje e regjistruar.</div>
                ) : (
                  e.meetings.map((m) => {
                    const mn = minutes.get(m.id);
                    return (
                      <div key={m.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <p className="text-sm font-medium text-slate-900">{m.title}</p>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                m.status === 'mbajtur' ? 'bg-emerald-100 text-emerald-700' :
                                m.status === 'planifikuar' ? 'bg-blue-100 text-blue-700' :
                                m.status === 'anuluar' ? 'bg-rose-100 text-rose-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {MEETING_STATUS_LABELS[m.status as MeetingStatus]}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 ml-6">
                              {m.meeting_date}
                              {m.start_time && ` · ${m.start_time.slice(0, 5)}`}
                              {m.location && ` · ${m.location}`}
                            </p>
                            {m.agenda && <p className="text-sm text-slate-600 mt-1 ml-6 italic">{m.agenda}</p>}
                            {mn && (
                              <div className="mt-2 ml-6 bg-slate-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                                  <p className="text-xs font-semibold text-slate-700">Procesverbali</p>
                                </div>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{mn.content}</p>
                                {mn.decisions && (
                                  <div className="mt-2 pt-2 border-t border-slate-200">
                                    <p className="text-xs font-semibold text-blue-700 mb-0.5">Vendimet:</p>
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{mn.decisions}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
