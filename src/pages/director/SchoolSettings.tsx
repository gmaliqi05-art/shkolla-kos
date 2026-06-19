import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { logAudit } from '../../lib/audit';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Building2, Save } from 'lucide-react';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { SCHOOL_TYPE_LABELS, type SchoolInfo, type SchoolType, type Municipality, type Locality } from '../../types/database';
import FileUpload from '../../components/FileUpload';
import SearchableSelect from '../../components/SearchableSelect';

export default function SchoolSettings() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [info, setInfo] = useState<SchoolInfo | null>(null);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    full_name: '',
    address: '',
    municipality: '',
    municipality_id: '',
    locality_id: '',
    school_type: 'fillore_mesme_ulet' as SchoolType,
    phone: '',
    email: '',
    website: '',
    director_name: '',
    registration_number: '',
    dpo_name: '',
    dpo_email: '',
    logo_url: '',
    stamp_url: '',
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [{ data: info }, { data: mun }, { data: loc }] = await Promise.all([
      supabase.from('school_info').select('*').limit(1).maybeSingle(),
      supabase.from('municipalities').select('*').order('name'),
      supabase.from('localities').select('*').order('name'),
    ]);
    setMunicipalities(mun || []);
    setLocalities(loc || []);
    const data = info;
    if (data) {
      setInfo(data);
      setForm({
        name: data.name || '',
        full_name: data.full_name || '',
        address: data.address || '',
        municipality: data.municipality || '',
        municipality_id: data.municipality_id || '',
        locality_id: data.locality_id || '',
        school_type: (data.school_type as SchoolType) || 'fillore_mesme_ulet',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        director_name: data.director_name || '',
        registration_number: data.registration_number || '',
        dpo_name: data.dpo_name || '',
        dpo_email: data.dpo_email || '',
        logo_url: data.logo_url || '',
        stamp_url: data.stamp_url || '',
      });
    }
    setLoading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage('');
    const payload = {
      ...form,
      logo_url: form.logo_url || null,
      stamp_url: form.stamp_url || null,
      municipality_id: form.municipality_id || null,
      locality_id: form.locality_id || null,
      // sinkronizo emrin tekstual të komunës me id-në e zgjedhur
      municipality: form.municipality_id
        ? (municipalities.find((m) => m.id === form.municipality_id)?.name || form.municipality)
        : form.municipality,
      updated_at: new Date().toISOString(),
    };
    const res = info
      ? await supabase.from('school_info').update(payload).eq('id', info.id)
      : await supabase.from('school_info').insert(payload);
    if (res.error) {
      setMessage('Gabim: ' + res.error.message);
    } else {
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'update',
        resourceType: 'school_info',
        resourceId: info?.id,
      });
      setMessage('Të dhënat e shkollës u ruajtën me sukses.');
      load();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('ss.title')}</h1>
          <p className="text-slate-500 text-sm">{t('ss.subtitle')}</p>
        </div>
      </div>

      {message && (
        <div className={`text-sm rounded-xl px-4 py-3 ${message.startsWith('Gabim') ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={save} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
            Identifikimi
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emri i shkurtër *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder='P.sh. "Naim Frashëri"'
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emri i plotë</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder='Shkolla Fillore dhe e Mesme e Ulët "..."'
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numri i regjistrimit</label>
              <input
                type="text"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                placeholder="Nr. i regjistrimit në MAShTI"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Drejtori/ja</label>
              <input
                type="text"
                value={form.director_name}
                onChange={(e) => setForm({ ...form, director_name: e.target.value })}
                placeholder="Emër Mbiemër"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
            Kontakti
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresa</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rruga, numri"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Komuna</label>
              <SearchableSelect
                value={form.municipality_id}
                onChange={(v) => setForm({ ...form, municipality_id: v, locality_id: '' })}
                placeholder="Kërko ose zgjidh komunën"
                groupBy
                options={municipalities.map((m) => ({ value: m.id, label: m.name, group: m.region || 'Pa rajon' }))}
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
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipi i shkollës</label>
              <select
                value={form.school_type}
                onChange={(e) => setForm({ ...form, school_type: e.target.value as SchoolType })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(SCHOOL_TYPE_LABELS) as SchoolType[]).map((t) => (
                  <option key={t} value={t}>{SCHOOL_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Faqja zyrtare</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-rose-500 rounded-full"></span>
            Mbrojtja e të Dhënave (Ligji 06/L-082)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zyrtari për Mbrojtjen e të Dhënave (DPO)</label>
              <input
                type="text"
                value={form.dpo_name}
                onChange={(e) => setForm({ ...form, dpo_name: e.target.value })}
                placeholder="Emër Mbiemër"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email i DPO-së</label>
              <input
                type="email"
                value={form.dpo_email}
                onChange={(e) => setForm({ ...form, dpo_email: e.target.value })}
                placeholder="dpo@shkolla.ks"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Kontakti i DPO-së kërkohet nga Ligji 06/L-082; shfaqet te politika e privatësisë dhe për kërkesat e subjekteve të të dhënave.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
            Logo & Vula e Shkollës
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Logo e shkollës</label>
              <FileUpload
                bucket="school-assets"
                folder="logos"
                accept="image/*"
                maxSizeMB={2}
                currentUrl={form.logo_url || null}
                label="Ngarko logo"
                onUploaded={(url) => setForm({ ...form, logo_url: url })}
                onRemoved={() => setForm({ ...form, logo_url: '' })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Vula e shkollës</label>
              <FileUpload
                bucket="school-assets"
                folder="stamps"
                accept="image/*"
                maxSizeMB={2}
                currentUrl={form.stamp_url || null}
                label="Ngarko vulën"
                onUploaded={(url) => setForm({ ...form, stamp_url: url })}
                onRemoved={() => setForm({ ...form, stamp_url: '' })}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Imazhet janë publike (lexim) — duhen për dëftesa dhe diploma zyrtare. Format i pranuar: PNG, JPG, WebP, SVG. Maksimumi 2 MB.
          </p>
        </section>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Ruaj Cilësimet
          </button>
        </div>
      </form>
    </div>
  );
}
