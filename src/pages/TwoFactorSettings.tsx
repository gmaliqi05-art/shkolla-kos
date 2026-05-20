import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAudit } from '../lib/audit';
import { Loader2, Shield, ShieldCheck, ShieldOff, AlertTriangle, Copy, Check } from 'lucide-react';

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export default function TwoFactorSettings() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<MFAFactor[]>([]);

  // Enrollment flow
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError(error.message);
      } else {
        const all = data?.all || [];
        setFactors(all.filter((f) => f.factor_type === 'totp'));
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  };

  const startEnrollment = async () => {
    setError('');
    setMessage('');
    setEnrolling(true);
    setQrCode('');
    setSecret('');
    setFactorId('');
    setVerifyCode('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      if (error) {
        setError(error.message);
        setEnrolling(false);
        return;
      }
      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (e) {
      setError((e as Error).message);
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!factorId || !verifyCode || verifyCode.length !== 6) {
      setError('Vendos 6 shifrat e kodit nga aplikacioni.');
      return;
    }
    setError('');
    try {
      const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
      if (chErr || !challenge) {
        setError(chErr?.message || 'Gabim krijimi i sfidës.');
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (vErr) {
        setError('Kodi është i pasaktë. Provo përsëri.');
        return;
      }
      if (profile) {
        await logAudit({
          actorId: profile.id,
          actorRole: profile.role,
          action: 'update',
          resourceType: 'mfa_enrollment',
          targetUserId: profile.id,
        });
      }
      setMessage('2FA u aktivizua me sukses!');
      setEnrolling(false);
      setQrCode('');
      setSecret('');
      setVerifyCode('');
      setFactorId('');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const unenroll = async (id: string) => {
    if (!confirm('Çaktivizo 2FA për llogarinë tënde? Llogaria do të kthehet në mbrojtje vetëm me fjalëkalim.')) return;
    setError('');
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) {
        setError(error.message);
        return;
      }
      if (profile) {
        await logAudit({
          actorId: profile.id,
          actorRole: profile.role,
          action: 'delete',
          resourceType: 'mfa_enrollment',
          targetUserId: profile.id,
        });
      }
      setMessage('2FA u çaktivizua.');
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const isEnrolled = factors.some((f) => f.status === 'verified');

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnrolled ? 'bg-emerald-100' : 'bg-amber-100'}`}>
          {isEnrolled ? <ShieldCheck className="w-5 h-5 text-emerald-600" /> : <Shield className="w-5 h-5 text-amber-600" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Autentifikim me Dy Faktorë (2FA)</h1>
          <p className="text-slate-500 text-sm">Mbroni llogarinë me një shtresë shtesë sigurie</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
          {message}
        </div>
      )}

      {/* Status card */}
      <div className={`rounded-2xl border p-5 ${isEnrolled ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {isEnrolled ? <ShieldCheck className="w-6 h-6 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />}
          <div className="flex-1">
            <p className="font-semibold text-slate-900">
              {isEnrolled ? '2FA është aktiv' : '2FA NUK është aktiv'}
            </p>
            <p className="text-sm text-slate-700 mt-1">
              {isEnrolled
                ? 'Llogaria juaj është e mbrojtur me një faktor shtesë sigurie. Çdo herë që hyni, do t\'ju kërkohet një kod 6-shifror nga aplikacioni i autentifikuesit.'
                : 'Rekomandohet që drejtori dhe mësuesit të aktivizojnë 2FA për të mbrojtur të dhënat e nxënësve të mitur.'}
            </p>
          </div>
        </div>
      </div>

      {/* Enrolled factors */}
      {factors.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Faktorët e regjistruar</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {factors.map((f) => (
              <div key={f.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{f.friendly_name || 'Authenticator App'}</p>
                  <p className="text-xs text-slate-500">
                    {f.factor_type.toUpperCase()} ·
                    Statusi: <span className={f.status === 'verified' ? 'text-emerald-600' : 'text-amber-600'}>{f.status}</span> ·
                    Krijuar: {new Date(f.created_at).toLocaleDateString('sq')}
                  </p>
                </div>
                <button
                  onClick={() => unenroll(f.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 rounded-lg"
                >
                  <ShieldOff className="w-4 h-4" />
                  Çaktivizo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollment flow */}
      {!isEnrolled && !enrolling && (
        <button
          onClick={startEnrollment}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
        >
          <Shield className="w-4 h-4" />
          Aktivizo 2FA
        </button>
      )}

      {enrolling && qrCode && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Hap 1: Skano kodin QR</h2>
          <p className="text-sm text-slate-700">
            Hap aplikacionin e autentifikuesit (Google Authenticator, Authy, Microsoft Authenticator, etj.) dhe skano kodin më poshtë.
          </p>

          <div className="bg-white border border-slate-300 rounded-xl p-4 flex flex-col items-center">
            <div className="w-48 h-48" dangerouslySetInnerHTML={{ __html: qrCode }} />
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-slate-600 hover:text-slate-900">Nuk mund të skanoni? Vendos kodin manualisht</summary>
            <div className="mt-2 flex items-center gap-2 bg-slate-50 rounded-lg p-3">
              <code className="flex-1 font-mono text-xs break-all">{secret}</code>
              <button onClick={copySecret} className={`p-1.5 rounded ${copied ? 'text-emerald-600' : 'text-slate-500 hover:bg-slate-200'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </details>

          <div className="pt-3 border-t border-slate-100">
            <h2 className="font-semibold text-slate-900 mb-2">Hap 2: Vendos kodin nga aplikacioni</h2>
            <p className="text-sm text-slate-600 mb-3">Pasi të keni skanuar, aplikacioni do të tregojë një kod 6-shifror që ndryshon çdo 30 sekonda. Vendoseni më poshtë:</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-32 text-center text-2xl font-mono tracking-widest px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => { setEnrolling(false); setQrCode(''); setSecret(''); setFactorId(''); }}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium"
            >
              Anulo
            </button>
            <button
              onClick={verifyEnrollment}
              disabled={verifyCode.length !== 6}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50"
            >
              Verifiko dhe Aktivizo
            </button>
          </div>
        </div>
      )}

      {/* Help section */}
      <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-700 space-y-2">
        <h3 className="font-semibold text-slate-900">Çfarë është 2FA?</h3>
        <p>
          Autentifikimi me dy faktorë (2FA) shton një shtresë shtesë sigurie te llogaria juaj. Përveç fjalëkalimit,
          ju duhet të vendosni një kod 6-shifror nga telefoni juaj çdo herë që hyni.
        </p>
        <p>
          Kjo do të thotë që edhe nëse dikush ju merr fjalëkalimin, nuk mund të hyjë në llogarinë tuaj pa telefonin tuaj.
        </p>
        <p className="text-xs text-slate-500 mt-3">
          <strong>Vërejtje:</strong> Nëse humbasni telefonin ku është aplikacioni i autentifikuesit, kontaktoni administratorin
          e sistemit për të rivendosur 2FA.
        </p>
      </div>
    </div>
  );
}
