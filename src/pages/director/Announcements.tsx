import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Announcement } from '../../types/database';
import {
  Plus,
  Megaphone,
  AlertTriangle,
  X,
  Send,
  Clock,
  Edit2,
  Trash2,
  MoreVertical,
  Loader2,
} from 'lucide-react';

export default function Announcements() {
  const { profile, isDemo } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState<string>('te_gjithe');
  const [isImportant, setIsImportant] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    if (isDemo) {
      setAnnouncements([
        { id: 'd1', title: 'Mbledhje e pergjithshme me prinderit', content: 'Te dashur prinder, ju ftojme ne mbledhjen e pergjithshme qe do te mbahet diten e enjte ne oren 17:00 ne sallen e shkolles.', author_id: 'demo', target_role: 'prind', is_important: true, created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'd2', title: 'Ndryshim ne orarin e mesimit', content: 'Per shkak te aktiviteteve te planifikuara, dita e premte do te kete orar te shkurtuar. Mesimi perfundon ne oren 12:00.', author_id: 'demo', target_role: 'te_gjithe', is_important: false, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'd3', title: 'Konkursi i Matematikes', content: 'Ftohen te gjithe nxenesit e klasave 6-9 te regjistrohen per konkursin e matematikes.', author_id: 'demo', target_role: 'nxenes', is_important: false, created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: 'd4', title: 'Trajnim per mesuesit', content: 'Trajnimi per metodat e reja te mesimdheniees do te mbahet diten e shtune ne oren 9:00.', author_id: 'demo', target_role: 'mesues', is_important: true, created_at: new Date(Date.now() - 259200000).toISOString() },
      ] as Announcement[]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetRole('te_gjithe');
    setIsImportant(false);
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (ann: Announcement) => {
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setTargetRole(ann.target_role);
    setIsImportant(ann.is_important);
    setShowForm(true);
    setActiveDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);

    if (isDemo) {
      if (editingId) {
        setAnnouncements(prev =>
          prev.map(a => a.id === editingId ? { ...a, title, content, target_role: targetRole as Announcement['target_role'], is_important: isImportant } : a)
        );
      } else {
        const newAnn: Announcement = {
          id: `d${Date.now()}`,
          title,
          content,
          author_id: profile.id,
          target_role: targetRole as Announcement['target_role'],
          is_important: isImportant,
          created_at: new Date().toISOString(),
        };
        setAnnouncements(prev => [newAnn, ...prev]);
      }
      resetForm();
      setSubmitting(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('announcements')
        .update({ title, content, target_role: targetRole, is_important: isImportant })
        .eq('id', editingId);
      if (!error) {
        resetForm();
        loadAnnouncements();
      }
    } else {
      const { error } = await supabase.from('announcements').insert({
        title,
        content,
        author_id: profile.id,
        target_role: targetRole,
        is_important: isImportant,
      });
      if (!error) {
        resetForm();
        loadAnnouncements();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('A jeni te sigurt qe doni te fshini kete njoftim?')) return;

    if (isDemo) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setActiveDropdown(null);
      return;
    }

    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      setActiveDropdown(null);
      loadAnnouncements();
    }
  };

  const TARGET_LABELS: Record<string, string> = {
    te_gjithe: 'Te Gjithe',
    mesues: 'Mesuesit',
    nxenes: 'Nxenesit',
    prind: 'Prinderit',
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Pak me pare';
    if (hours < 24) return `${hours} ore me pare`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} dite me pare`;
    return new Date(dateStr).toLocaleDateString('sq-AL');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Njoftimet</h1>
          <p className="text-slate-500 mt-1">Menaxhoni njoftimet e shkolles</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/25"
        >
          <Plus className="w-4 h-4" />
          Njoftim i Ri
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edito Njoftimin' : 'Njoftim i Ri'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titulli</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Permbajtja</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Per</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  >
                    <option value="te_gjithe">Te Gjithe</option>
                    <option value="mesues">Mesuesit</option>
                    <option value="nxenes">Nxenesit</option>
                    <option value="prind">Prinderit</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">I rendesishem</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Anullo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {editingId ? 'Ruaj Ndryshimet' : 'Publiko'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nuk ka njoftime</h3>
            <p className="text-slate-500 text-sm">Shtoni njoftimin e pare duke klikuar butonin me lart.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-6 transition-all hover:shadow-lg ${
                ann.is_important ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                  ann.is_important ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'
                }`}>
                  {ann.is_important ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {TARGET_LABELS[ann.target_role] || ann.target_role}
                    </span>
                    {ann.is_important && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                        I rendesishem
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{ann.content}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {formatTime(ann.created_at)}
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setActiveDropdown(activeDropdown === ann.id ? null : ann.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeDropdown === ann.id && (
                    <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-10">
                      <button
                        onClick={() => openEditForm(ann)}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edito
                      </button>
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Fshi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
