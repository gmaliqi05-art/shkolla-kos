import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ToastProvider';
import FileUpload from '../../components/FileUpload';
import { useI18n } from '../../lib/i18n/I18nProvider';
import { User, Phone, Mail, Lock, Save, Loader2, Camera } from 'lucide-react';

export default function ProfileSettings() {
  const { profile, isDemo } = useAuth();
  const toast = useToast();
  const { t } = useI18n();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleAvatarUploaded = async (publicUrl: string) => {
    if (!profile) return;
    if (isDemo) {
      setAvatarUrl(publicUrl);
      toast.info('Modaliteti demo — ndryshimet nuk ruhen.');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', profile.id);
    if (error) {
      toast.error('Gabim gjatë ruajtjes së fotos: ' + error.message);
      return;
    }
    setAvatarUrl(publicUrl);
    toast.success('Fotografia u përditësua.');
  };

  const handleAvatarRemoved = async () => {
    if (!profile) return;
    if (isDemo) {
      setAvatarUrl(null);
      toast.info('Modaliteti demo — ndryshimet nuk ruhen.');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id);
    if (error) {
      toast.error('Gabim: ' + error.message);
      return;
    }
    setAvatarUrl(null);
    toast.success('Fotografia u hoq.');
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!fullName.trim()) {
      toast.error('Emri i plotë është i detyrueshëm.');
      return;
    }
    if (isDemo) {
      toast.info('Modaliteti demo — ndryshimet nuk ruhen.');
      return;
    }
    setSavingInfo(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq('id', profile.id);
    setSavingInfo(false);
    if (error) toast.error('Gabim: ' + error.message);
    else toast.success('Profili u përditësua.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast.info('Modaliteti demo — fjalëkalimi nuk mund të ndryshohet.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Fjalëkalimet nuk përputhen.');
      return;
    }
    setSavingPassword(true);
    // Verifiko fjalëkalimin aktual
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile?.email || '',
      password: currentPassword,
    });
    if (signInError) {
      setSavingPassword(false);
      toast.error('Fjalëkalimi aktual nuk është i saktë.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      toast.success('Fjalëkalimi u ndryshua me sukses.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('profile.title')}</h1>
          <p className="text-slate-500 text-sm">{t('profile.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-500" />
          {t('profile.photo')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" loading="lazy" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-10 h-10" />
            )}
          </div>
          <div className="flex-1">
            <FileUpload
              bucket="avatars"
              folder={profile?.id}
              accept="image/*"
              maxSizeMB={2}
              currentUrl={avatarUrl}
              onUploaded={handleAvatarUploaded}
              onRemoved={avatarUrl ? handleAvatarRemoved : undefined}
              label={t('profile.upload_photo')}
              preview={false}
            />
            <p className="text-xs text-slate-400 mt-2">{t('profile.photo_help')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          {t('profile.personal_info')}
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('common.email')}</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            {profile?.email || '—'}
            <span className="ml-auto text-xs text-slate-400">{t('profile.email_cannot_change')}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('profile.full_name')} *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('common.phone')}</label>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400 absolute ml-3 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+383 44 xxx xxx"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingInfo}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 text-sm"
        >
          {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('profile.save_changes')}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          {t('profile.change_password')}
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('profile.current_password')} *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('profile.new_password')} *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <p className="text-xs text-slate-400 mt-1">{t('profile.min_chars')}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t('profile.confirm_password')} *</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 text-sm"
        >
          {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {t('profile.change_password')}
        </button>
      </form>
    </div>
  );
}
