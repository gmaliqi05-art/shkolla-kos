import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { UserRole } from '../types/database';
import { GraduationCap, Eye, EyeOff, BookOpen, Users, BarChart3, Shield, Loader2, CircleUser as UserCircle, School, User, UserCheck, ArrowLeft, CheckCircle, Crown, Building, Heart, ClipboardCheck, ShieldCheck } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
// Shield is used both in landing image and MFA challenge screen

import type { TranslationKey } from '../lib/i18n/translations';

const ROLES: { value: UserRole; labelKey: TranslationKey; descKey: TranslationKey }[] = [
  { value: 'mesues', labelKey: 'role.mesues', descKey: 'role.mesues_desc' },
  { value: 'nxenes', labelKey: 'role.nxenes', descKey: 'role.nxenes_desc' },
  { value: 'prind', labelKey: 'role.prind', descKey: 'role.prind_desc' },
];

const DEMO_USERS: { role: UserRole; nameKey: TranslationKey; icon: typeof UserCircle; color: string }[] = [
  { role: 'ministri', nameKey: 'role.ministri', icon: Crown, color: 'from-purple-500 to-purple-600' },
  { role: 'drejtor_komunal', nameKey: 'role.drejtor_komunal', icon: Building, color: 'from-amber-500 to-amber-600' },
  { role: 'inspektor', nameKey: 'role.inspektor', icon: ClipboardCheck, color: 'from-orange-500 to-orange-600' },
  { role: 'drejtor', nameKey: 'role.school_principal', icon: School, color: 'from-blue-500 to-blue-600' },
  { role: 'pedagog', nameKey: 'role.pedagog', icon: Heart, color: 'from-pink-500 to-pink-600' },
  { role: 'mesues', nameKey: 'role.mesues', icon: UserCheck, color: 'from-teal-500 to-teal-600' },
  { role: 'nxenes', nameKey: 'role.nxenes', icon: User, color: 'from-cyan-500 to-cyan-600' },
  { role: 'prind', nameKey: 'role.prind', icon: Users, color: 'from-slate-600 to-slate-700' },
  { role: 'super_admin', nameKey: 'role.super_admin', icon: ShieldCheck, color: 'from-zinc-700 to-slate-800' },
];

export default function LoginPage() {
  const { signIn, signUp, demoSignIn } = useAuth();
  const { t } = useI18n();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('mesues');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // MFA challenge state
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  const checkMfaRequired = async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data && data.currentLevel === 'aal1' && data.nextLevel === 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((f) => f.status === 'verified');
      if (verified) {
        const { data: ch, error } = await supabase.auth.mfa.challenge({ factorId: verified.id });
        if (!error && ch) {
          setMfaFactorId(verified.id);
          setMfaChallengeId(ch.id);
          return true;
        }
      }
    }
    return false;
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) return;
    setMfaLoading(true);
    setError('');
    const { error: err } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: mfaChallengeId,
      code: mfaCode,
    });
    if (err) {
      setError(t('login.mfa_invalid'));
    } else {
      setMfaFactorId('');
      setMfaChallengeId('');
      setMfaCode('');
    }
    setMfaLoading(false);
  };

  const handleMfaCancel = async () => {
    await supabase.auth.signOut();
    setMfaFactorId('');
    setMfaChallengeId('');
    setMfaCode('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin,
    });
    if (err) {
      setError(err.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!fullName.trim()) {
        setError(t('login.full_name_required'));
        setLoading(false);
        return;
      }
      const result = await signUp(email, password, fullName, role);
      if (result.error) setError(result.error);
    } else {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        const needsMfa = await checkMfaRequired();
        if (needsMfa) {
          setLoading(false);
          return;
        }
      }
    }
    setLoading(false);
  };

  if (mfaChallengeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t('login.security_check_title')}</h1>
              <p className="text-sm text-slate-500">{t('login.security_check_help')}</p>
            </div>
          </div>
          {error && <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{error}</div>}
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('login.mfa_code')}</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                className="w-full text-center text-3xl font-mono tracking-widest px-3 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={mfaLoading || mfaCode.length !== 6}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mfaLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('login.mfa_verify')}
            </button>
            <button
              type="button"
              onClick={handleMfaCancel}
              className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
            >
              {t('btn.cancel')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-teal-300 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Shkolla</h1>
              <p className="text-blue-200 text-sm">{t('login.system_name')}</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            {t('login.hero_line1')}
            <br />
            <span className="text-teal-300">{t('login.hero_line2')}</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-12 max-w-md">
            {t('login.hero_description')}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <BookOpen className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">{t('login.feature_grades')}</h3>
              <p className="text-blue-200 text-xs mt-1">{t('login.feature_grades_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Users className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">{t('login.feature_communication')}</h3>
              <p className="text-blue-200 text-xs mt-1">{t('login.feature_communication_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <BarChart3 className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">{t('login.feature_reports')}</h3>
              <p className="text-blue-200 text-xs mt-1">{t('login.feature_reports_desc')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Shield className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">{t('login.feature_security')}</h3>
              <p className="text-blue-200 text-xs mt-1">{t('login.feature_security_desc')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Shkolla</h1>
              <p className="text-slate-500 text-xs">{t('login.system_name')}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            {showReset ? (
              <div>
                <button
                  onClick={() => { setShowReset(false); setError(''); setResetSent(false); }}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('btn.back')}
                </button>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{t('login.reset_password_title')}</h2>
                <p className="text-slate-500 text-sm mb-6">
                  {t('login.reset_subtitle')}
                </p>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {resetSent ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-slate-900 font-semibold">{t('login.email_sent_title')}</p>
                    <p className="text-sm text-slate-500 mt-1">{t('login.email_sent_help')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                        placeholder={t('login.email_placeholder')}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {resetLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                      {t('login.send_link')}
                    </button>
                  </form>
                )}
              </div>
            ) : (
            <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {isRegister ? t('login.create_account') : t('login.welcome_title')}
              </h2>
              <p className="text-slate-500 mt-1">
                {isRegister
                  ? t('login.register_subtitle')
                  : t('login.signin_subtitle')}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t('login.full_name')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder={t('login.full_name_placeholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      {t('login.role')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            role === r.value
                              ? 'border-blue-500 bg-blue-50 text-blue-900'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <span className="block text-sm font-semibold">{t(r.labelKey)}</span>
                          <span className="block text-xs mt-0.5 opacity-70">{t(r.descKey)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('common.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                  placeholder={t('login.email_placeholder')}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400 pr-12"
                    placeholder={t('login.password_placeholder')}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isRegister && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setShowReset(true); setError(''); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t('login.forgot_password')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isRegister ? t('login.signup') : t('login.signin')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {isRegister
                  ? t('login.have_account_signin')
                  : t('login.no_account_signup')}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 mb-4">
                {t('login.demo_account')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => demoSignIn(demo.role)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gradient-to-r ${demo.color} text-white text-xs font-medium hover:opacity-90 transition-colors`}
                  >
                    <demo.icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t(demo.nameKey)}</span>
                  </button>
                ))}
              </div>
            </div>
            </>
            )}
          </div>

          <div className="mt-6 text-center space-y-2">
            <Link to="/dokumentet-ligjore" className="text-xs text-slate-500 hover:text-slate-700 underline">
              {t('login.legal_documents')}
            </Link>
            <p className="text-slate-400 text-xs">
              {t('login.footer')} &copy; 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
