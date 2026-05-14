import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { generateSecurePassword } from '../../lib/utils';
import type { Profile } from '../../types/database';
import {
  Search, Plus, Trash2, X, UserPlus, Loader2, Mail, Phone,
  Link2, MoreVertical, Copy, Check as CheckIcon,
} from 'lucide-react';

interface ParentFormData {
  full_name: string;
  email: string;
  phone: string;
}

interface StudentOption {
  id: string;
  full_name: string;
  class_name?: string;
}

interface ParentWithChildren extends Profile {
  children: StudentOption[];
}

export default function ManageParents() {
  const [parents, setParents] = useState<ParentWithChildren[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentWithChildren | null>(null);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [formData, setFormData] = useState<ParentFormData>({ full_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    await Promise.all([loadParents(), loadStudents()]);
    setLoading(false);
  };

  const loadParents = async () => {
    const { data: profiles } = await supabase
      .from('profiles').select('*').eq('role', 'prind').order('full_name');
    if (!profiles || profiles.length === 0) { setParents([]); return; }

    const { data: links } = await supabase
      .from('parent_students')
      .select('parent_id, student_id, profiles!parent_students_student_id_fkey(id, full_name)');

    const { data: enrollments } = await supabase
      .from('student_classes').select('student_id, classes(name)');

    const classMap = new Map<string, string>();
    enrollments?.forEach((e: any) => { if (e.classes?.name) classMap.set(e.student_id, e.classes.name); });

    const childrenMap = new Map<string, StudentOption[]>();
    links?.forEach((l: any) => {
      const list = childrenMap.get(l.parent_id) || [];
      list.push({ id: l.student_id, full_name: l.profiles?.full_name || '', class_name: classMap.get(l.student_id) });
      childrenMap.set(l.parent_id, list);
    });

    setParents(profiles.map((p) => ({ ...p, children: childrenMap.get(p.id) || [] })));
  };

  const loadStudents = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'nxenes').order('full_name');
    setStudents(data || []);
  };

  const handleCopy = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalëkalimi: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddParent = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) { setError('Emri dhe email-i janë të detyrueshme.'); return; }
    setSubmitting(true); setError('');
    const password = generateSecurePassword();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password });
    if (authError || !authData.user) { setError(authError?.message || 'Gabim gjatë krijimit.'); setSubmitting(false); return; }
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id, email: formData.email,
      full_name: formData.full_name.trim(), role: 'prind', phone: formData.phone.trim(),
    });
    if (profileError) { setError(profileError.message); setSubmitting(false); return; }
    setNewCredentials({ email: formData.email, password });
    setShowAddModal(false); setShowCredentials(true);
    setFormData({ full_name: '', email: '', phone: '' }); setSubmitting(false);
    await loadParents();
  };

  const handleLinkChild = async () => {
    if (!selectedParent || !linkStudentId) return;
    setSubmitting(true);
    const { error } = await supabase.from('parent_students').insert({ parent_id: selectedParent.id, student_id: linkStudentId });
    if (error) { setError(error.message); } else { setShowLinkModal(false); setLinkStudentId(''); await loadParents(); }
    setSubmitting(false);
  };

  const handleUnlinkChild = async (parentId: string, studentId: string) => {
    if (!confirm('A jeni i sigurt?')) return;
    await supabase.from('parent_students').delete().eq('parent_id', parentId).eq('student_id', studentId);
    await loadParents();
  };

  const handleDeleteParent = async (parent: ParentWithChildren) => {
    if (!confirm(`Fshi llogarinë e ${parent.full_name}?`)) return;
    await supabase.from('profiles').delete().eq('id', parent.id);
    await loadParents();
  };

  const filtered = parents.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Prindërit</h1>
          <p className="text-slate-500 text-sm mt-1">{parents.length} prindër të regjistruar</p>
        </div>
        <button onClick={() => { setShowAddModal(true); setError(''); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus className="w-4 h-4" /> Shto Prind
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Kërko prindërit..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400"><UserPlus className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nuk u gjetën prindër.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((parent) => (
            <div key={parent.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-800">{parent.full_name}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Prind</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{parent.email}</span>
                    {parent.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{parent.phone}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {parent.children.map((child) => (
                      <span key={child.id} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                        {child.full_name}
                        {child.class_name && <span className="text-slate-400">· {child.class_name}</span>}
                        <button onClick={() => handleUnlinkChild(parent.id, child.id)} className="text-slate-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <button onClick={() => { setSelectedParent(parent); setShowLinkModal(true); setError(''); }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-full border border-dashed border-blue-300 hover:border-blue-500 transition-colors">
                      <Link2 className="w-3 h-3" /> Lidh fëmijë
                    </button>
                  </div>
                </div>
                <div className="relative ml-4">
                  <button onClick={() => setActiveDropdown(activeDropdown === parent.id ? null : parent.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeDropdown === parent.id && (
                    <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-40">
                      <button onClick={() => { handleDeleteParent(parent); setActiveDropdown(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" /> Fshi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Shto Prind të Ri</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i plotë *</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="p.sh. Driton Krasniqi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="prindi@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+383 4X XXX XXX" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">Anulo</button>
              <button onClick={handleAddParent} disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Krijo Llogari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Child Modal */}
      {showLinkModal && selectedParent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Lidh Fëmijë</h2>
                <p className="text-sm text-slate-500 mt-0.5">për {selectedParent.full_name}</p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zgjedh nxënësin</label>
              <select value={linkStudentId} onChange={(e) => setLinkStudentId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Zgjedh nxënësin --</option>
                {students.filter(s => !selectedParent.children.find(c => c.id === s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowLinkModal(false)} className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">Anulo</button>
              <button onClick={handleLinkChild} disabled={!linkStudentId || submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Lidh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && newCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-green-700">✓ Llogaria u krijua!</h2>
              <button onClick={() => setShowCredentials(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Ruajini këto kredenciale dhe jepjani prindit:</p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-sm space-y-1">
              <div><span className="text-slate-400">Email:</span> <span className="font-medium">{newCredentials.email}</span></div>
              <div><span className="text-slate-400">Fjalëkalimi:</span> <span className="font-medium">{newCredentials.password}</span></div>
            </div>
            <button onClick={handleCopy} className="mt-4 w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-50">
              {copied ? <><CheckIcon className="w-4 h-4 text-green-600" /> U kopjua!</> : <><Copy className="w-4 h-4" /> Kopjo</>}
            </button>
            <button onClick={() => setShowCredentials(false)} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Mbyll</button>
          </div>
        </div>
      )}
    </div>
  );
}
