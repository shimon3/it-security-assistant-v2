import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { checkPwnedPassword } from '../utils/pwnedPasswords';
import { useLanguage } from '../i18n';

interface HibpResult {
  pwned: boolean;
  count: number;
  errorMessage?: string;
}

export default function HibpPage() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwResult, setPwResult] = useState<HibpResult | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);

  async function handlePasswordCheck() {
    if (!password.trim()) {
      setPwError(t('enterPassword'));
      return;
    }
    setPwError('');
    setPwResult(null);
    setPwLoading(true);

    try {
      setPwResult(await checkPwnedPassword(password));
    } catch {
      setPwError(t('checkFailed'));
    } finally {
      setPwLoading(false);
    }
  }

  function handleEmailCheck() {
    if (!email.trim()) return;
    setEmailChecked(true);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<ShieldAlert className="w-5 h-5 text-brand" />}
        title={t('hibpTitle')}
        description={t('hibpDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('breachPasswordTitle')}</h2>
            <p className="text-muted text-sm mt-1">{t('breachPasswordDesc')}</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-ink-2">{t('password')}</label>
            <div className="relative">
              <input
                dir="ltr"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwError) setPwError(''); if (pwResult) setPwResult(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordCheck()}
                placeholder={t('passwordPlaceholder')}
                autoComplete="new-password"
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 pe-11 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink-2 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-faint">{t('breachPrivacy')}</p>
            {pwError && <p className="text-red-700 text-xs">{pwError}</p>}

            <button
              type="button"
              onClick={handlePasswordCheck}
              disabled={pwLoading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              {t('checkPassword')}
            </button>
          </div>

          {pwResult && !pwResult.errorMessage && (
            <div className="animate-fade-in">
              {pwResult.pwned ? (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-4">
                  <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 font-semibold text-sm">
                      {t('breachFound')} <span dir="ltr">({pwResult.count.toLocaleString()})</span>
                    </p>
                    <p className="text-red-700 text-xs mt-1">{t('breachKnown')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4">
                  <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0" />
                  <p className="text-emerald-700 font-semibold text-sm">{t('breachNotFound')}</p>
                </div>
              )}
            </div>
          )}

          {pwResult?.errorMessage && <p className="text-red-700 text-xs animate-fade-in">{pwResult.errorMessage}</p>}
        </div>

        <div className="border-t border-line" />

        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t('emailBreachTitle')}</h2>
            <p className="text-muted text-sm mt-1">{t('emailBreachDesc')}</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-ink-2">{t('emailAddress')}</label>
            <div className="flex gap-3">
              <input
                dir="ltr"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailChecked) setEmailChecked(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailCheck()}
                placeholder="user@example.com"
                className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                className="flex items-center gap-2 bg-brand hover:bg-brand-strong text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
              >
                {t('checkEmail')}
              </button>
            </div>
          </div>

          {emailChecked && (
            <div className="animate-fade-in bg-brand-soft border border-brand/25 rounded-xl px-4 py-4 space-y-1">
              <p className="text-brand-strong font-semibold text-sm">{t('apiKeyRequired')}</p>
              <p className="text-brand text-sm">
                {t('hibpEmailNotice')} <span dir="ltr" className="font-mono text-brand-strong">HIBP_API_KEY</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
