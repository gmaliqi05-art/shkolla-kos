import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ToastProvider';
import { User, Phone, Mail, Lock, Save, Loader2 } from 'lucide-react';

export default function ProfileSettings() {
  const { profile, isDemo } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
          <h1 className="text-2xl font-bold text-slate-900">Profili Im</h1>
          <p className="text-slate-500 text-sm">Menaxho informacionin personal dhe sigurinë e llogarisë</p>
        </div>
      </div>

      <form onSubmit={handleSaveInfo} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          Informacioni personal
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            {profile?.email || '—'}
            <span className="ml-auto text-xs text-slate-400">Nuk mund të ndryshohet</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Emri i plotë *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Telefoni</label>
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
          Ruaj ndryshimet
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          Ndrysho fjalëkalimin
        </h2>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fjalëkalimi aktual *</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Fjalëkalimi i ri *</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Të paktën 8 karaktere</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Konfirmo fjalëkalimin e ri *</label>
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
          Ndrysho fjalëkalimin
        </button>
      </form>
    </div>
  );
}
