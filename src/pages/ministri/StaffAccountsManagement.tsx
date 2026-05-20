import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import type { Profile, Municipality, UserRole } from '../../types/database';
import { Loader2, Plus, X, Building, Edit2, Trash2, Search, Mail, Phone, Copy, Check as CheckIcon, UserCheck, Crown } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

interface DkaRow extends Profile {
  municipality_name?: string;
}

function generateSecurePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const special = '!@#$';
  const arr = new Uint8Array(10);
  crypto.getRandomValues(arr);
  const pwd = Array.from(arr).map((n) => chars[n % chars.length]).join('');
  return pwd.slice(0, 7) + special[arr[0] % special.length] + (arr[1] % 9 + 1);
}

export default function StaffAccountsManagement() {
  const { profile } = useAuth();
  const [staff, setStaff] = useState<DkaRow[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | ''>('drejtor_komunal');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'drejtor_komunal' as UserRole,
    managed_municipality_id: '',
  });

  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const [staffRes, munRes] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['drejtor_komunal', 'inspektor', 'ministri']).is('deleted_at', null).order('full_name'),
      supabase.from('municipalities').select('*').order('name'),
    ]);
    const staffList: Profile[] = staffRes.data || [];
    const munList = munRes.data || [];
    const munMap = new Map(munList.map((m) => [m.id, m.name]));
    setStaff(staffList.map((s) => ({
      ...s,
      municipality_name: s.managed_municipality_id ? munMap.get(s.managed_municipality_id) : undefined,
    })));
    setMunicipalities(munList);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'drejtor_komunal',
      managed_municipality_id: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (s: Profile) => {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      role: s.role,
      managed_municipality_id: s.managed_municipality_id || '',
    });
    setError('');
    setShowModal(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitting(true);
    setError('');

    if (editing) {
      const { error: updateErr } = await supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone,
        role: form.role,
        managed_municipality_id: form.role === 'drejtor_komunal' ? (form.managed_municipality_id || null) : null,
      }).eq('id', editing.id);
      if (updateErr) {
        setError(updateErr.message);
      } else {
        await logAudit({ actorId: profile.id, actorRole: profile.role, action: 'update', resourceType: 'staff', targetUserId: editing.id });
        setShowModal(false);
        load();
      }
      setSubmitting(false);
      return;
    }

    // Create new account
    const tempPassword = generateSecurePassword();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: tempPassword,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
          role: form.role,
          managed_municipality_id: form.role === 'drejtor_komunal' ? (form.managed_municipality_id || null) : null,
          must_change_password: true,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      // Profili krijohet automatikisht nga trigger handle_new_user
      // (shih migration 20260520090000_auto_create_profile_on_signup)
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'create',
        resourceType: 'staff',
        targetUserId: authData.user.id,
        metadata: { role: form.role, municipality: form.managed_municipality_id },
      });
      setNewCredentials({ email: form.email, password: tempPassword });
      load();
    }
    setSubmitting(false);
  };

  const remove = async (s: Profile) => {
    if (!confirm(`Çaktivizo llogarinë e ${s.full_name}?`)) return;
    await supabase.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', s.id);
    load();
  };

  const copyCredentials = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalëkalimi: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = staff.filter((s) => {
    if (filterRole && s.role !== filterRole) return false;
    if (search && !s.full_name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const roleConfig: Record<string, { label: string; color: string; icon: typeof Building }> = {
    drejtor_komunal: { label: 'DKA', color: 'bg-amber-100 text-amber-700', icon: Building },
    inspektor: { label: 'Inspektor', color: 'bg-orange-100 text-orange-700', icon: UserCheck },
    ministri: { label: 'Ministër', color: 'bg-purple-100 text-purple-700', icon: Crown },
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stafi i Lartë Administrativ</h1>
            <p className="text-slate-500 text-sm">Menaxhimi i DKA-ve, Inspektorëve dhe Ministrave</p>
          </div>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium">
          <Plus className="w-4 h-4" />
          Krijo Llogari
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko emër ose email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
        </div>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as UserRole | '')} className="px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500">
          <option value="">Të gjitha rolet</option>
          <option value="drejtor_komunal">Vetëm DKA</option>
          <option value="inspektor">Vetëm Inspektorë</option>
          <option value="ministri">Vetëm Ministra</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">
              {staff.length === 0 ? 'Asnjë llogari e regjistruar' : 'Asnjë rezultat me filtrat e zgjedhur'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {staff.length === 0
                ? 'Krijo llogarinë e parë administrative (DKA, Inspektor, Ministër).'
                : 'Provoni të hiqni filtrat ose ndryshoni kërkimin.'}
            </p>
            {staff.length === 0 ? (
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Krijo Llogari
              </button>
            ) : (
              <button
                onClick={() => { setSearch(''); setFilterRole(''); }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Pastro filtrat
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Emri</th>
                <th className="px-4 py-3">Roli</th>
                <th className="px-4 py-3">Komuna e menaxhuar</th>
                <th className="px-4 py-3">Kontakt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => {
                const cfg = roleConfig[s.role] || { label: s.role, color: 'bg-slate-100 text-slate-700', icon: Building };
                const Icon = cfg.icon;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{s.municipality_name || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>
                      {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => remove(s)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {newCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900">Llogaria u Krijua me Sukses</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-1">Kjo është hera e vetme që mund të shihet fjalëkalimi!</p>
              <p className="text-xs text-amber-700">Ndajeni me përdoruesin në mënyrë të sigurt.</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Email</p>
                <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">{newCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Fjalëkalimi i përkohshëm</p>
                <p className="text-sm font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 tracking-widest">{newCredentials.password}</p>
              </div>
            </div>
            <button
              onClick={copyCredentials}
              className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'U kopjua!' : 'Kopjo Kredencialet'}
            </button>
            <button
              onClick={() => { setNewCredentials(null); setShowModal(false); }}
              className="mt-2 w-full py-2.5 text-sm text-slate-600 hover:text-slate-900"
            >
              Mbyll
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Llogarinë' : 'Krijo Llogari të Re'}</h2>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Roli *</label>
                <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="drejtor_komunal">Drejtor Komunal (DKA)</option>
                  <option value="inspektor">Inspektor Arsimit</option>
                  <option value="ministri">Ministër MAShTI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i plotë *</label>
                <input required type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input required={!editing} disabled={!!editing} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 disabled:text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              {form.role === 'drejtor_komunal' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <label className="block text-sm font-medium text-amber-900 mb-1">Komuna që do menaxhojë *</label>
                  <SearchableSelect
                    required
                    value={form.managed_municipality_id}
                    onChange={(v) => setForm({ ...form, managed_municipality_id: v })}
                    placeholder="Kërko ose zgjidh komunën"
                    groupBy
                    options={municipalities.map((m) => ({ value: m.id, label: m.name, group: m.region || 'Pa rajon' }))}
                  />
                  <p className="text-xs text-amber-700 mt-2">DKA do të menaxhojë vetëm shkollat e kësaj komune.</p>
                </div>
              )}
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Ruaj' : 'Krijo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
