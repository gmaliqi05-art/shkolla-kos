import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, Calendar, X, Edit2 } from 'lucide-react';
import {
  SCHOOL_EVENT_LABELS,
  SCHOOL_EVENT_COLORS,
  type SchoolEventType,
  type SchoolCalendarEvent,
} from '../../types/database';

export default function SchoolCalendar() {
  const { profile } = useAuth();
  const isDirector = profile?.role === 'drejtor';

  const [events, setEvents] = useState<SchoolCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<SchoolEventType | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SchoolCalendarEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    event_type: 'feste' as SchoolEventType,
    title: '',
    description: '',
    is_school_day: false,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('school_calendar')
      .select('*')
      .order('date');
    setEvents(data || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      event_type: 'feste',
      title: '',
      description: '',
      is_school_day: false,
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (e: SchoolCalendarEvent) => {
    setEditing(e);
    setForm({
      date: e.date,
      event_type: e.event_type,
      title: e.title,
      description: e.description,
      is_school_day: e.is_school_day,
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');
    const payload = {
      date: form.date,
      event_type: form.event_type,
      title: form.title,
      description: form.description,
      is_school_day: form.is_school_day,
      created_by: profile.id,
    };
    const res = editing
      ? await supabase.from('school_calendar').update(payload).eq('id', editing.id)
      : await supabase.from('school_calendar').insert(payload);
    if (res.error) {
      setError(res.error.message);
    } else {
      setShowModal(false);
      load();
    }
    setSubmitting(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Fshini këtë event?')) return;
    await supabase.from('school_calendar').delete().eq('id', id);
    load();
  };

  const filtered = filterType ? events.filter((e) => e.event_type === filterType) : events;

  // Group by month
  const grouped = new Map<string, SchoolCalendarEvent[]>();
  filtered.forEach((e) => {
    const month = e.date.slice(0, 7); // YYYY-MM
    const list = grouped.get(month) || [];
    list.push(e);
    grouped.set(month, list);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kalendari Shkollor</h1>
            <p className="text-slate-500 text-sm">Festat, pushimet, provimet dhe aktivitetet</p>
          </div>
        </div>
        {isDirector && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Shto Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Të gjitha ({events.length})
          </button>
          {(Object.keys(SCHOOL_EVENT_LABELS) as SchoolEventType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterType === t ? SCHOOL_EVENT_COLORS[t] : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {SCHOOL_EVENT_LABELS[t]} ({events.filter((e) => e.event_type === t).length})
            </button>
          ))}
        </div>
      </div>

      {grouped.size === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 px-6 py-12 text-center text-slate-400 text-sm">
          Asnjë event në kalendarin shkollor.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([month, evs]) => (
            <div key={month} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="font-semibold text-slate-900">
                  {new Date(month + '-01').toLocaleDateString('sq', { year: 'numeric', month: 'long' })}
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {evs.map((e) => (
                  <div key={e.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${SCHOOL_EVENT_COLORS[e.event_type]}`}>
                          {SCHOOL_EVENT_LABELS[e.event_type]}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{e.title}</span>
                        {!e.is_school_day && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-700">Pa mësim</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{e.date}</p>
                      {e.description && <p className="text-sm text-slate-600 mt-1">{e.description}</p>}
                    </div>
                    {isDirector && (
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(e)} className="p-1 text-slate-400 hover:text-slate-700">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(e.id)} className="p-1 text-slate-400 hover:text-rose-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Eventin' : 'Event i Ri'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
                  <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lloji *</label>
                  <select required value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value as SchoolEventType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {(Object.keys(SCHOOL_EVENT_LABELS) as SchoolEventType[]).map((t) => (
                      <option key={t} value={t}>{SCHOOL_EVENT_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="P.sh. Festa e Pavarësisë" className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Përshkrimi</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_school_day} onChange={(e) => setForm({ ...form, is_school_day: e.target.checked })} className="rounded" />
                  <span className="text-sm text-slate-700">Ditë me mësim (jo pushim)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
