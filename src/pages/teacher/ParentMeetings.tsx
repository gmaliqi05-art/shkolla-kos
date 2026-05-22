import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  PARENT_MEETING_TYPE_LABELS,
  MEETING_STATUS_LABELS,
  type ParentMeetingType,
  type ParentMeeting,
  type MeetingStatus,
} from '../../types/database';
import { Loader2, Plus, X, Users, Calendar, MapPin, Edit2, FileText } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface MeetingRow extends ParentMeeting {
  class_name?: string;
  student_name?: string;
}

const STATUS_COLORS: Record<MeetingStatus, string> = {
  planifikuar: 'bg-blue-100 text-blue-700',
  mbajtur: 'bg-emerald-100 text-emerald-700',
  anuluar: 'bg-rose-100 text-rose-700',
  shtyer: 'bg-amber-100 text-amber-700',
};

export default function ParentMeetings() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const isParent = profile?.role === 'prind';
  const canManage = profile?.role === 'drejtor' || profile?.role === 'mesues';

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ParentMeeting | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    meeting_type: 'klase' as ParentMeetingType,
    class_id: '',
    student_id: '',
    title: '',
    meeting_date: new Date().toISOString().slice(0, 10),
    start_time: '17:00',
    end_time: '18:00',
    location: '',
    agenda: '',
    status: 'planifikuar' as MeetingStatus,
    notes: '',
  });

  useEffect(() => {
    load();
  }, [profile?.id]);

  const load = async () => {
    if (!profile) return;
    const { data: meetingsData } = await supabase
      .from('parent_meetings')
      .select('*')
      .order('meeting_date', { ascending: false })
      .limit(200);
    const items: ParentMeeting[] = meetingsData || [];

    const classIds = Array.from(new Set(items.map((m) => m.class_id).filter((id): id is string => !!id)));
    const studentIds = Array.from(new Set(items.map((m) => m.student_id).filter((id): id is string => !!id)));

    const [classesRes, studentsRes] = await Promise.all([
      classIds.length > 0 ? supabase.from('classes').select('id, name').in('id', classIds) : Promise.resolve({ data: [] }),
      studentIds.length > 0 ? supabase.from('profiles').select('id, full_name').in('id', studentIds) : Promise.resolve({ data: [] }),
    ]);
    const classMap = new Map((classesRes.data || []).map((c) => [c.id, c.name]));
    const studentMap = new Map((studentsRes.data || []).map((s) => [s.id, s.full_name]));

    setMeetings(items.map((m) => ({
      ...m,
      class_name: m.class_id ? classMap.get(m.class_id) : undefined,
      student_name: m.student_id ? studentMap.get(m.student_id) : undefined,
    })));

    if (canManage) {
      const [allClasses, allStudents] = await Promise.all([
        supabase.from('classes').select('id, name').order('grade_level').order('section'),
        supabase.from('profiles').select('id, full_name').eq('role', 'nxenes').is('deleted_at', null).order('full_name'),
      ]);
      setClasses(allClasses.data || []);
      setStudents(allStudents.data || []);
    }

    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      meeting_type: 'klase', class_id: '', student_id: '', title: '',
      meeting_date: new Date().toISOString().slice(0, 10),
      start_time: '17:00', end_time: '18:00',
      location: '', agenda: '', status: 'planifikuar', notes: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (m: ParentMeeting) => {
    setEditing(m);
    setForm({
      meeting_type: m.meeting_type,
      class_id: m.class_id || '',
      student_id: m.student_id || '',
      title: m.title,
      meeting_date: m.meeting_date,
      start_time: m.start_time?.slice(0, 5) || '',
      end_time: m.end_time?.slice(0, 5) || '',
      location: m.location,
      agenda: m.agenda,
      status: m.status,
      notes: m.notes,
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
      meeting_type: form.meeting_type,
      class_id: form.meeting_type === 'klase' ? (form.class_id || null) : null,
      student_id: form.meeting_type === 'individuale' ? (form.student_id || null) : null,
      title: form.title,
      meeting_date: form.meeting_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      location: form.location,
      agenda: form.agenda,
      status: form.status,
      notes: form.notes,
      organized_by: profile.id,
    };
    const res = editing
      ? await supabase.from('parent_meetings').update({ ...payload, organized_by: undefined }).eq('id', editing.id)
      : await supabase.from('parent_meetings').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('pm.title')}</h1>
            <p className="text-slate-500 text-sm">
              {isParent ? t('pm.subtitle_parent') : t('pm.subtitle_teacher')}
            </p>
          </div>
        </div>
        {canManage && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            {t('pm.create_btn')}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {meetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
            {t('pm.none_registered')}
          </div>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
                      {PARENT_MEETING_TYPE_LABELS[m.meeting_type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {MEETING_STATUS_LABELS[m.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mt-1">{m.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {m.meeting_date}
                      {m.start_time && ` · ${m.start_time.slice(0, 5)}${m.end_time ? `–${m.end_time.slice(0, 5)}` : ''}`}
                    </span>
                    {m.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {m.location}
                      </span>
                    )}
                    {m.class_name && <span>{t('pm.class_label')} <strong>{m.class_name}</strong></span>}
                    {m.student_name && <span>{t('pm.for_label')} <strong>{m.student_name}</strong></span>}
                  </div>
                  {m.agenda && <p className="text-sm text-slate-700 mt-2 italic">{t('pm.agenda_label')} {m.agenda}</p>}
                  {m.notes && (
                    <div className="mt-2 bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-slate-700 mb-0.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {t('pm.meeting_notes')}
                      </p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.notes}</p>
                    </div>
                  )}
                </div>
                {canManage && (
                  <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded shrink-0">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? t('pm.modal_edit') : t('pm.new')}</h2>
              <button onClick={() => setShowModal(false)} aria-label={t('common.close')}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_type')}</label>
                <select required value={form.meeting_type} onChange={(e) => setForm({ ...form, meeting_type: e.target.value as ParentMeetingType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                  {(Object.keys(PARENT_MEETING_TYPE_LABELS) as ParentMeetingType[]).map((mtype) => (
                    <option key={mtype} value={mtype}>{PARENT_MEETING_TYPE_LABELS[mtype]}</option>
                  ))}
                </select>
              </div>
              {form.meeting_type === 'klase' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_class')}</label>
                  <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">{t('diary.choose')}</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {form.meeting_type === 'individuale' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_student')}</label>
                  <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">{t('diary.choose')}</option>
                    {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_title')}</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_date')}</label>
                  <input required type="date" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_from')}</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_to')}</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_location')}</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_agenda')}</label>
                <textarea rows={2} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
              </div>
              {editing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_status')}</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as MeetingStatus })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500">
                      {(Object.keys(MEETING_STATUS_LABELS) as MeetingStatus[]).map((s) => (
                        <option key={s} value={s}>{MEETING_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('pm.field_after_notes')}</label>
                    <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">{t('common.cancel')}</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
