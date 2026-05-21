import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile } from '../../types/database';
import { Search, Phone, Mail, MoreVertical, Plus, CreditCard as Edit2, Trash2, X, UserPlus, Loader2, Copy, Check as CheckIcon, Heart } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';

interface FormData {
  full_name: string;
  email: string;
  phone: string;
}

function generateSecurePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  const pwd = Array.from(arr).map((n) => chars[n % chars.length]).join('');
  return pwd.slice(0, 7) + special[arr[0] % special.length] + (arr[1] % 9 + 1);
}

export default function ManagePedagogues() {
  const { profile } = useAuth();
  const toast = useToast();
  const [pedagogues, setPedagogues] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPedagog, setSelectedPedagog] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<FormData>({ full_name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('profiles').select('*').eq('role', 'pedagog').is('deleted_at', null);
    if (profile?.school_id) q = q.eq('school_id', profile.school_id);
    const { data } = await q.order('full_name');
    setPedagogues(data || []);
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalëkalimi: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const tempPassword = generateSecurePassword();

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: tempPassword,
      options: {
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          role: 'pedagog',
          school_id: profile?.school_id || null,
          must_change_password: true,
        },
      },
    });

    if (signUpError) {
      toast.error('Gabim: ' + signUpError.message);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      toast.success('Pedagogu u shtua me sukses.');
      setShowAddModal(false);
      setFormData({ full_name: '', email: '', phone: '' });
      setNewCredentials({ email: formData.email, password: tempPassword });
      setShowCredentials(true);
      load();
    }
    setSubmitting(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPedagog) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: formData.full_name, phone: formData.phone })
      .eq('id', selectedPedagog.id);
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      toast.success('Pedagogu u përditësua.');
      setShowEditModal(false);
      load();
    }
    setSubmitting(false);
  };

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Fshij pedagogun: ${p.full_name}?`)) return;
    const { error } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', p.id);
    if (error) toast.error('Gabim: ' + error.message);
    else {
      toast.success('Pedagogu u fshi.');
      load();
    }
    setActiveDropdown(null);
  };

  const openEditModal = (p: Profile) => {
    setSelectedPedagog(p);
    setFormData({ full_name: p.full_name, email: p.email, phone: p.phone || '' });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const filtered = pedagogues.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pedagogët</h1>
            <p className="text-slate-500 text-sm">{pedagogues.length} pedagog gjithsej</p>
          </div>
        </div>
        <button
          onClick={() => { setFormData({ full_name: '', email: '', phone: '' }); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          Shto Pedagog
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko pedagog..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">
              {pedagogues.length === 0 ? 'Asnjë pedagog i regjistruar' : 'Nuk u gjet asnjë rezultat'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {pedagogues.length === 0
                ? 'Shto pedagogun e parë të shkollës.'
                : 'Provoni një kërkim tjetër.'}
            </p>
            {pedagogues.length === 0 && (
              <button
                onClick={() => { setFormData({ full_name: '', email: '', phone: '' }); setShowAddModal(true); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Shto Pedagog
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase">
                  <th className="px-6 py-3">Pedagogu</th>
                  <th className="px-6 py-3">Kontakti</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center text-white font-bold">
                          {p.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{p.full_name}</p>
                          <p className="text-xs text-slate-500">Pedagog</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {p.email}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === p.id ? null : p.id)}
                          aria-label="Veprime"
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeDropdown === p.id && (
                          <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10">
                            <button
                              onClick={() => openEditModal(p)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edito
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Fshi
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {showAddModal ? <UserPlus className="w-5 h-5 text-pink-600" /> : <Edit2 className="w-5 h-5 text-pink-600" />}
                <h2 className="text-lg font-bold text-slate-900">
                  {showAddModal ? 'Shto Pedagog të Ri' : 'Edito Pedagogun'}
                </h2>
              </div>
              <button
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                aria-label="Mbyll"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={showAddModal ? handleAdd : handleEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Emri i plotë *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={showEditModal}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm disabled:bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50"
                >
                  Anulo
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (showAddModal ? 'Krijo' : 'Ruaj')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCredentials && newCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Llogaria u krijua</h2>
            <p className="text-sm text-slate-500 mb-4">Ndajeni këto kredenciale me pedagogun. Ata duhet të ndryshojnë fjalëkalimin në hyrjen e parë.</p>
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Email:</span>
                <code className="text-sm text-slate-900">{newCredentials.email}</code>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Fjalëkalimi:</span>
                <code className="text-sm text-slate-900">{newCredentials.password}</code>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopjuar' : 'Kopjo'}
              </button>
              <button
                onClick={() => { setShowCredentials(false); setNewCredentials(null); }}
                className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-medium"
              >
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
