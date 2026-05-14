import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/database';
import {
  GraduationCap,
  Eye,
  EyeOff,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  Loader2,
  UserCircle,
  School,
  User,
  UserCheck,
} from 'lucide-react';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'drejtor', label: 'Drejtor', description: 'Menaxhoni shkollen' },
  { value: 'mesues', label: 'Mesues', description: 'Menaxhoni klasat' },
  { value: 'nxenes', label: 'Nxenes', description: 'Shikoni notat' },
  { value: 'prind', label: 'Prind', description: 'Ndiqni femijen' },
];

const DEMO_USERS: { role: UserRole; name: string; icon: typeof UserCircle; color: string }[] = [
  { role: 'drejtor', name: 'Drejtor', icon: School, color: 'from-blue-500 to-blue-600' },
  { role: 'mesues', name: 'Mesues', icon: UserCheck, color: 'from-teal-500 to-teal-600' },
  { role: 'nxenes', name: 'Nxenes', icon: User, color: 'from-cyan-500 to-cyan-600' },
  { role: 'prind', name: 'Prind', icon: Users, color: 'from-slate-600 to-slate-700' },
];

export default function LoginPage() {
  const { signIn, signUp, demoSignIn } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('nxenes');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Ju lutem vendosni emrin e plote');
        setLoading(false);
        return;
      }
      const result = await signUp(email, password, fullName, role);
      if (result.error) setError(result.error);
    } else {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex">
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
              <p className="text-blue-200 text-sm">Sistemi i Menaxhimit</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-6">
            Platforma moderne per
            <br />
            <span className="text-teal-300">menaxhimin e shkolles</span>
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-12 max-w-md">
            Menaxhoni notat, mungesat, orarin dhe komunikoni me te gjithe aktoret
            e shkolles ne nje vend te vetem.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <BookOpen className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">Nota Dixhitale</h3>
              <p className="text-blue-200 text-xs mt-1">Menaxhimi i plote i notave</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Users className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">Komunikim</h3>
              <p className="text-blue-200 text-xs mt-1">Prind, mesues, nxenes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <BarChart3 className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">Raporte</h3>
              <p className="text-blue-200 text-xs mt-1">Statistika te detajuara</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <Shield className="w-6 h-6 mb-2 text-teal-300" />
              <h3 className="font-semibold text-sm">Siguri</h3>
              <p className="text-blue-200 text-xs mt-1">Te dhena te mbrojtura</p>
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
              <p className="text-slate-500 text-xs">Sistemi i Menaxhimit</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {isRegister ? 'Krijo llogari' : 'Mire se vini'}
              </h2>
              <p className="text-slate-500 mt-1">
                {isRegister
                  ? 'Plotesoni te dhenat per te krijuar llogarine'
                  : 'Identifikohuni per te hyre ne platforme'}
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
                      Emri i plote
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                      placeholder="Emri Mbiemri"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Roli
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
                          <span className="block text-sm font-semibold">{r.label}</span>
                          <span className="block text-xs mt-0.5 opacity-70">{r.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                  placeholder="emri@shkolla.al"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Fjalekalimi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400 pr-12"
                    placeholder="Minimumi 6 karaktere"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isRegister ? 'Regjistrohu' : 'Hyr'}
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
                  ? 'Keni llogari? Identifikohuni'
                  : 'Nuk keni llogari? Regjistrohuni'}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-500 mb-4">
                Ose hyni me nje llogari demo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_USERS.map((demo) => (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => demoSignIn(demo.role)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r ${demo.color} text-white text-sm font-medium hover:opacity-90 transition-all shadow-md`}
                  >
                    <demo.icon className="w-4 h-4" />
                    {demo.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            Shkolla - Sistemi i Menaxhimit te Shkolles &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
}
