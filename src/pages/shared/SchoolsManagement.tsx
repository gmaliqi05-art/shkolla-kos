import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ToastProvider';
import {
  SCHOOL_TYPE_LABELS,
  type SchoolInfo,
  type SchoolType,
  type Municipality,
  type Locality,
} from '../../types/database';
import { Loader2, Plus, X, School, Edit2, Trash2, MapPin, Phone, Mail, Building, Copy, Check as CheckIcon, UserCheck } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';

interface SchoolRow extends SchoolInfo {
  municipality_name?: string;
  locality_name?: string;
}

export default function SchoolsManagement() {
  const { profile } = useAuth();
  const toast = useToast();
  const isMinister = profile?.role === 'ministri';
  const isDka = profile?.role === 'drejtor_komunal';
  const canManage = isMinister || isDka;

  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMunicipality, setFilterMunicipality] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SchoolInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    full_name: '',
    address: '',
    municipality_id: '',
    locality_id: '',
    school_type: 'fillore_mesme_ulet' as SchoolType,
    phone: '',
    email: '',
    director_name: '',
    registration_number: '',
  });

  // Director account creation form (when creating school)
  const [createDirectorAccount, setCreateDirectorAccount] = useState(false);
  const [directorForm, setDirectorForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);

  useEffect(() => {
    load();
  }, [profile?.id]);

  const load = async () => {
    setLoading(true);
    const [schoolsRes, munRes, locRes] = await Promise.all([
      isDka && profile?.managed_municipality_id
        ? supabase.from('school_info').select('*').eq('municipality_id', profile.managed_municipality_id)
        : supabase.from('school_info').select('*'),
      supabase.from('municipalities').select('*').order('name'),
      supabase.from('localities').select('*').order('name'),
    ]);
    const schoolsList: SchoolInfo[] = schoolsRes.data || [];
    const munList = munRes.data || [];
    const locList = locRes.data || [];

    const munMap = new Map(munList.map((m) => [m.id, m.name]));
    const locMap = new Map(locList.map((l) => [l.id, l.name]));

    setSchools(schoolsList.map((s) => ({
      ...s,
      municipality_name: s.municipality_id ? munMap.get(s.municipality_id) : undefined,
      locality_name: s.locality_id ? locMap.get(s.locality_id) : undefined,
    })));
    setMunicipalities(munList);
    setLocalities(locList);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      full_name: '',
      address: '',
      municipality_id: isDka && profile?.managed_municipality_id ? profile.managed_municipality_id : '',
      locality_id: '',
      school_type: 'fillore_mesme_ulet',
      phone: '',
      email: '',
      director_name: '',
      registration_number: '',
    });
    setCreateDirectorAccount(false);
    setDirectorForm({ full_name: '', email: '', phone: '' });
    setError('');
    setShowModal(true);
  };

  const generateSecurePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const special = '!@#$';
    const arr = new Uint8Array(10);
    crypto.getRandomValues(arr);
    const pwd = Array.from(arr).map((n) => chars[n % chars.length]).join('');
    return pwd.slice(0, 7) + special[arr[0] % special.length] + (arr[1] % 9 + 1);
  };

  const copyCredentials = async () => {
    if (!newCredentials) return;
    await navigator.clipboard.writeText(`Email: ${newCredentials.email}\nFjalëkalimi: ${newCredentials.password}`);
    setCredentialsCopied(true);
    setTimeout(() => setCredentialsCopied(false), 2000);
  };

  const openEdit = (s: SchoolInfo) => {
    setEditing(s);
    setForm({
      name: s.name,
      full_name: s.full_name,
      address: s.address,
      municipality_id: s.municipality_id || '',
      locality_id: s.locality_id || '',
      school_type: (s.school_type as SchoolType) || 'fillore_mesme_ulet',
      phone: s.phone,
      email: s.email,
      director_name: s.director_name,
      registration_number: s.registration_number,
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
      full_name: form.full_name,
      address: form.address,
      municipality_id: form.municipality_id || null,
      locality_id: form.locality_id || null,
      school_type: form.school_type,
      municipality: form.municipality_id
        ? (municipalities.find((m) => m.id === form.municipality_id)?.name || '')
        : '',
      phone: form.phone,
      email: form.email,
      director_name: form.director_name,
      registration_number: form.registration_number,
      updated_at: new Date().toISOString(),
    };
    const res = editing
      ? await supabase.from('school_info').update(payload).eq('id', editing.id)
      : await supabase.from('school_info').insert(payload).select().single();

    if (res.error) {
      setError(res.error.message);
      setSubmitting(false);
      return;
    }

    const createdSchoolId = !editing && res.data ? (res.data as { id: string }).id : null;

    // If creating new school AND user wants to create director account
    if (!editing && createDirectorAccount && createdSchoolId && directorForm.email && directorForm.full_name) {
      const tempPassword = generateSecurePassword();
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: directorForm.email,
        password: tempPassword,
      });

      if (signUpError) {
        setError(`Shkolla u krijua por gabim te llogaria e drejtorit: ${signUpError.message}`);
        setSubmitting(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          email: directorForm.email,
          full_name: directorForm.full_name,
          phone: directorForm.phone,
          role: 'drejtor',
          school_id: createdSchoolId,
          must_change_password: true,
        });
        if (profileError) {
          setError(`Shkolla u krijua por gabim te profili i drejtorit: ${profileError.message}`);
          setSubmitting(false);
          return;
        }
        // Update school with director name
        await supabase.from('school_info').update({ director_name: directorForm.full_name }).eq('id', createdSchoolId);
        setNewCredentials({ email: directorForm.email, password: tempPassword });
        load();
        setSubmitting(false);
        return;
      }
    }

    setShowModal(false);
    load();
    setSubmitting(false);
  };

  const remove = async (s: SchoolInfo) => {
    if (!confirm(`Fshij shkollën "${s.name}"? Të gjitha të dhënat e lidhura me të do të humbasin.`)) return;
    const { error } = await supabase.from('school_info').delete().eq('id', s.id);
    if (error) toast.error('Gabim: ' + error.message);
    else { toast.success('Shkolla u fshi.'); load(); }
  };

  const filtered = filterMunicipality
    ? schools.filter((s) => s.municipality_id === filterMunicipality)
    : schools;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <School className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Menaxhimi i Shkollave</h1>
            <p className="text-slate-500 text-sm">
              {isMinister ? 'Të gjitha shkollat e Kosovës' : isDka ? 'Shkollat e komunës suaj' : 'Shkollat'}
            </p>
          </div>
        </div>
        {canManage && (
          <button onClick={openNew} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
            <Plus className="w-4 h-4" />
            Shto Shkollë
          </button>
        )}
      </div>

      {isMinister && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="block text-xs font-medium text-slate-500 mb-1">Filtro sipas komunës</label>
          <SearchableSelect
            value={filterMunicipality}
            onChange={setFilterMunicipality}
            placeholder="Të gjitha komunat"
            groupBy
            options={municipalities.map((m) => ({ value: m.id, label: m.name, group: m.region || 'Pa rajon' }))}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <School className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-700 font-medium mb-1">
              {schools.length === 0 ? 'Asnjë shkollë e regjistruar' : 'Asnjë shkollë me filtrin e zgjedhur'}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              {schools.length === 0
                ? canManage ? 'Shto shkollën e parë për të filluar.' : 'Lista është bosh aktualisht.'
                : 'Provoni të hiqni filtrin.'}
            </p>
            {schools.length > 0 && filterMunicipality ? (
              <button
                onClick={() => setFilterMunicipality('')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                Pastro filtrin
              </button>
            ) : schools.length === 0 && canManage && (
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Shto Shkollë
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase">
                <th className="px-4 py-3">Shkolla</th>
                <th className="px-4 py-3">Lloji</th>
                <th className="px-4 py-3">Komuna / Fshati</th>
                <th className="px-4 py-3">Drejtori</th>
                <th className="px-4 py-3">Kontakt</th>
                {canManage && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    {s.full_name && <p className="text-xs text-slate-500">{s.full_name}</p>}
                    {s.registration_number && <p className="text-xs text-slate-400 font-mono">Nr: {s.registration_number}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {s.school_type ? SCHOOL_TYPE_LABELS[s.school_type] : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-1 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400 mt-0.5" />
                      <div>
                        {s.municipality_name && <p className="text-slate-700 font-medium">{s.municipality_name}</p>}
                        {s.locality_name && <p className="text-slate-500">{s.locality_name}</p>}
                        {s.address && <p className="text-slate-400 mt-0.5">{s.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{s.director_name || <span className="text-slate-400 italic">pa caktuar</span>}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {s.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</div>}
                    {s.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</div>}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-slate-700">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isMinister && (
                          <button onClick={() => remove(s)} className="p-1.5 text-slate-400 hover:text-rose-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
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
              <h2 className="text-lg font-bold text-slate-900">Llogaria e Drejtorit u Krijua!</h2>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-900 font-medium mb-1">Ruajeni këto kredenciale tani!</p>
              <p className="text-xs text-amber-700">
                Kjo është hera e vetme që mund të shihet fjalëkalimi. Ndajeni me drejtorin në mënyrë të sigurt
                (email i sigurt ose person-më-person).
              </p>
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
                credentialsCopied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {credentialsCopied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {credentialsCopied ? 'U kopjua!' : 'Kopjo Kredencialet'}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edito Shkollën' : 'Krijo Shkollë të Re'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} aria-label="Mbyll"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            {error && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-3 py-2">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emri i shkollës *</label>
                  <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder='P.sh. "Naim Frashëri"' />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lloji i shkollës *</label>
                  <select required value={form.school_type} onChange={(e) => setForm({ ...form, school_type: e.target.value as SchoolType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    {(Object.keys(SCHOOL_TYPE_LABELS) as SchoolType[]).map((t) => (
                      <option key={t} value={t}>{SCHOOL_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emri i plotë zyrtar</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Komuna *</label>
                  <SearchableSelect
                    required
                    disabled={isDka}
                    value={form.municipality_id}
                    onChange={(v) => setForm({ ...form, municipality_id: v, locality_id: '' })}
                    placeholder="Kërko ose zgjidh komunën"
                    groupBy
                    options={municipalities.map((m) => ({
                      value: m.id,
                      label: m.name,
                      group: m.region || 'Pa rajon',
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fshati / Qyteti</label>
                  <SearchableSelect
                    disabled={!form.municipality_id}
                    value={form.locality_id}
                    onChange={(v) => setForm({ ...form, locality_id: v })}
                    placeholder="Kërko ose zgjidh vendin"
                    options={localities
                      .filter((l) => l.municipality_id === form.municipality_id)
                      .map((l) => ({
                        value: l.id,
                        label: l.name,
                        description: l.is_city_center ? 'Qendër e komunës' : l.type,
                      }))}
                    emptyText={form.municipality_id ? 'Asnjë vendbanim' : 'Zgjidh komunën fillimisht'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Adresa</label>
                <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rruga, numri" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Drejtori (emri)</label>
                  <input type="text" value={form.director_name} onChange={(e) => setForm({ ...form, director_name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nr. regjistrimit MAShTI</label>
                  <input type="text" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {!editing && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={createDirectorAccount}
                      onChange={(e) => setCreateDirectorAccount(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-emerald-900">
                      Krijo gjithashtu llogarinë e drejtorit të shkollës
                    </span>
                  </label>
                  {createDirectorAccount && (
                    <div className="space-y-3 mt-3 pt-3 border-t border-emerald-200">
                      <p className="text-xs text-emerald-700">
                        Drejtori do të marrë një email me kredencialet. Do t'i duhet të ndryshojë fjalëkalimin në hyrjen e parë.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Emri i drejtorit *</label>
                          <input
                            required={createDirectorAccount}
                            type="text"
                            value={directorForm.full_name}
                            onChange={(e) => setDirectorForm({ ...directorForm, full_name: e.target.value })}
                            placeholder="Emër Mbiemër"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Email i drejtorit *</label>
                          <input
                            required={createDirectorAccount}
                            type="email"
                            value={directorForm.email}
                            onChange={(e) => setDirectorForm({ ...directorForm, email: e.target.value })}
                            placeholder="drejtor@shkolla.ks"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon i drejtorit</label>
                        <input
                          type="tel"
                          value={directorForm.phone}
                          onChange={(e) => setDirectorForm({ ...directorForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Anulo</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
