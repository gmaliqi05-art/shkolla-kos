import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
  type ExtracurricularActivity,
  type ActivityParticipant,
} from '../../types/database';
import { Loader2, Plus, X, Trophy, Users, Edit2, ChevronDown, ChevronRight, UserPlus, Check, UserX } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';

interface ActivityWithDetails extends ExtracurricularActivity {
  coordinator_name?: string;
  participant_count?: number;
}

interface ParticipantRow extends ActivityParticipant {
  student_name?: string;
}

const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  sport: 'bg-emerald-100 text-emerald-700',
  art: 'bg-pink-100 text-pink-700',
  shkence: 'bg-blue-100 text-blue-700',
  muzike: 'bg-purple-100 text-purple-700',
  gjuhe: 'bg-cyan-100 text-cyan-700',
  teknologji: 'bg-indigo-100 text-indigo-700',
  kulturore: 'bg-amber-100 text-amber-700',
  sociale: 'bg-teal-100 text-teal-700',
  mjedis: 'bg-lime-100 text-lime-700',
  olimpiada: 'bg-orange-100 text-orange-700',
  tjeter: 'bg-slate-100 text-slate-700',
};

export default function Activities() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [activities, setActivities] = useState<ActivityWithDetails[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [participants, setParticipants] = useState<Map<string, ParticipantRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ExtracurricularActivity | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const canManage = profile?.role === 'drejtor' || profile?.role === 'mesues' || profile?.role === 'pedagog';

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'sport' as ActivityCategory,
    coordinator_id: '',
    schedule: '',
    location: '',
    max_participants: '',
  });

  const [participantForm, setParticipantForm] = useState({ student_id: '', notes: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [activitiesRes, teachersRes, studentsRes, participantsRes] = await Promise.all([
      supabase.from('extracurricular_activities').select('*').order('name'),
      supabase.from('profiles').select('id, full_name').eq('role', 'mesues').is('deleted_at', null),
      supabase.from('profiles').select('id, full_name').eq('role', 'nxenes').is('deleted_at', null).order('full_name'),
      supabase.from('activity_participants').select('*'),
    ]);

    const acts: ExtracurricularActivity[] = activitiesRes.data || [];
    const allTeachers: { id: string; full_name: string }[] = teachersRes.data || [];
    const teacherMap = new Map(allTeachers.map((t) => [t.id, t.full_name]));

    const participantList: ActivityParticipant[] = participantsRes.data || [];
    const studentIds = Array.from(new Set(participantList.map((p) => p.student_id)));
    const { data: pProfiles } = studentIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', studentIds)
      : { data: [] };
    const studentMap = new Map((pProfiles || []).map((p) => [p.id, p.full_name]));

    const participantsByActivity = new Map<string, ParticipantRow[]>();
    participantList.forEach((p) => {
      const list = participantsByActivity.get(p.activity_id) || [];
      list.push({ ...p, student_name: studentMap.get(p.student_id) || '—' });
      participantsByActivity.set(p.activity_id, list);
    });

    setActivities(acts.map((a) => ({
      ...a,
      coordinator_name: (a.coordinator_id && teacherMap.get(a.coordinator_id)) || '',
      participant_count: participantsByActivity.get(a.id)?.length || 0,
    })));
    setTeachers(allTeachers);
    setStudents(studentsRes.data || []);
    setParticipants(participantsByActivity);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', category: 'sport', coordinator_id: '', schedule: '', location: '', max_participants: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (a: ExtracurricularActivity) => {
    setEditing(a);
    setForm({
      name: a.name,
      description: a.description,
      category: a.category,
      coordinator_id: a.coordinator_id || '',
      schedule: a.schedule,
      location: a.location,
      max_participants: a.max_participants ? String(a.max_participants) : '',
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      coordinator_id: form.coordinator_id || null,
      schedule: form.schedule,
      location: form.location,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
    };
    const res = editing
      ? await supabase.from('extracurricular_activities').update(payload).eq('id', editing.id)
      : await supabase.from('extracurricular_activities').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  const addParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddParticipant) return;
    setSubmitting(true);
    setError('');
    const { error: err } = await supabase.from('activity_participants').insert({
      activity_id: showAddParticipant,
      student_id: participantForm.student_id,
      notes: participantForm.notes,
    });
    if (err) {
      setError(err.message);
    } else {
      setShowAddParticipant(null);
      setParticipantForm({ student_id: '', notes: '' });
      load();
    }
    setSubmitting(false);
  };

  const removeParticipant = async (id: string) => {
    if (!confirm('Largo këtë nxënës nga aktiviteti?')) return;
    await supabase.from('activity_participants').delete().eq('id', id);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('act.title')}</h1>
            <p className="text-slate-500 text-sm">{t('act.subtitle')}</p>
          </div>
        </div>
        {canManage && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Shto Aktivitet
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë aktivitet i regjistruar.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((a) => {
            const isOpen = expanded === a.id;
            const ps = participants.get(a.id) || [];
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[a.category]}`}>
                        {ACTIVITY_CATEGORY_LABELS[a.category]}
                      </span>
                      {!a.is_active && <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">Joaktiv</span>}
                    </div>
                    <h3 className="font-semibold text-slate-900 mt-1">{a.name}</h3>
                    {a.description && <p className="text-sm text-slate-600 mt-1">{a.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      {a.coordinator_name && <span>Koordinator: <strong>{a.coordinator_name}</strong></span>}
                      {a.schedule && <span>Orari: {a.schedule}</span>}
                      {a.location && <span>Vendi: {a.location}</span>}
                      <span>
                        <Users className="w-3 h-3 inline mr-1" />
                        {a.participant_count} {a.max_participants ? `/ ${a.max_participants}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canManage && (
                      <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => setExpanded(isOpen ? null : a.id)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Pjesëmarrësit ({ps.length})
                      </h4>
                      {canManage && (
                        <button
                          onClick={() => { setShowAddParticipant(a.id); setParticipantForm({ student_id: '', notes: '' }); }}
                          className="text-xs text-amber-700 hover:text-amber-900 font-medium inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Shto nxënës
                        </button>
                      )}
                    </div>
                    {ps.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Asnjë pjesëmarrës.</p>
                    ) : (
                      <ul className="space-y-1">
                        {ps.map((p) => (
                          <li key={p.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 text-sm">
                            <span className="font-medium text-slate-900">{p.student_name}</span>
                            {p.parent_consent ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">
                                <Check className="w-3 h-3" />
                                Pëlqim prindi
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                                Pa pëlqim prindi
                              </span>
                            )}
                            {canManage && (
                              <button onClick={() => removeParticipant(p.id)} className="ml-auto text-xs text-rose-600 hover:text-rose-800">
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Aktivitetin' : 'Aktivitet i Ri'}</h2>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri *</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder='P.sh. "Klubi i Shkencës"' className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategoria *</label>
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ActivityCategory })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                  {(Object.keys(ACTIVITY_CATEGORY_LABELS) as ActivityCategory[]).map((c) => (
                    <option key={c} value={c}>{ACTIVITY_CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Koordinatori</label>
                <select value={form.coordinator_id} onChange={(e) => setForm({ ...form, coordinator_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">— Pa koordinator —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orari</label>
                  <input type="text" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="P.sh. E martë 15:00-16:30" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Maksimumi pjesëmarrësve</label>
                  <input type="number" min="1" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendi</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Klasa, salla, terreni" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ruaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Shto Pjesëmarrës</h2>
              <button onClick={() => setShowAddParticipant(null)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={addParticipant} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nxënësi *</label>
                <select required value={participantForm.student_id} onChange={(e) => setParticipantForm({ ...participantForm, student_id: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">— Zgjidh —</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shënime</label>
                <textarea rows={2} value={participantForm.notes} onChange={(e) => setParticipantForm({ ...participantForm, notes: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
              <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl px-3 py-2">
                Prindi do të duhet të japë pëlqimin për pjesëmarrjen e fëmijës nga paneli i tij.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddParticipant(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
