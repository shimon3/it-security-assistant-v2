import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface HibpResult {
  pwned: boolean;
  count: number;
  errorMessage?: string;
}

export default function HibpPage() {
  // Password section
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwResult, setPwResult] = useState<HibpResult | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  // Email section
  const [email, setEmail] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);

  async function handlePasswordCheck() {
    if (!password.trim()) { setPwError('Please enter a password to check.'); return; }
    setPwError('');
    setPwResult(null);
    setPwLoading(true);

    try {
      const res = await fetch('/api/hibp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data: HibpResult = await res.json();
      setPwResult(data);
    } catch {
      setPwError('Check failed — verify your connection and try again.');
    } finally {
      setPwLoading(false);
    }
  }

  function handleEmailCheck() {
    if (!email.trim()) return;
    setEmailChecked(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<ShieldAlert className="w-5 h-5 text-sky-400" />}
        title="Have I Been Pwned"
        description="Check if your credentials appear in known data breaches"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">

        {/* Section 1: Password Breach Check */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Password Breach Check</h2>
            <p className="text-slate-500 text-sm mt-1">Verify if your password has appeared in a known data breach.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (pwError) setPwError(''); if (pwResult) setPwResult(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordCheck()}
                placeholder="Enter a password to check..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Your password is never sent — only an anonymized hash prefix is checked.
            </p>

            {pwError && <p className="text-red-400 text-xs">{pwError}</p>}

            <button
              onClick={handlePasswordCheck}
              disabled={pwLoading}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Check Password
            </button>
          </div>

          {pwResult && !pwResult.errorMessage && (
            <div className="animate-fade-in">
              {pwResult.pwned ? (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-4">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-semibold text-sm">
                      Found in {pwResult.count.toLocaleString()} breaches — change this password immediately
                    </p>
                    <p className="text-red-400/70 text-xs mt-1">
                      This password is publicly known. Do not use it for any account.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-4">
                  <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-emerald-400 font-semibold text-sm">
                    Not found in known breaches
                  </p>
                </div>
              )}
            </div>
          )}

          {pwResult?.errorMessage && (
            <p className="text-red-400 text-xs animate-fade-in">{pwResult.errorMessage}</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* Section 2: Email Breach Check */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Email Breach Check</h2>
            <p className="text-slate-500 text-sm mt-1">Check if your email address has appeared in a known data breach.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailChecked) setEmailChecked(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleEmailCheck()}
                placeholder="e.g. user@example.com"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
              <button
                onClick={handleEmailCheck}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
              >
                Check Email
              </button>
            </div>
          </div>

          {emailChecked && (
            <div className="animate-fade-in bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-4 space-y-1">
              <p className="text-sky-300 font-semibold text-sm">API Key Required</p>
              <p className="text-sky-400/80 text-sm">
                Email breach checking requires a HaveIBeenPwned API key. Visit{' '}
                <a
                  href="https://haveibeenpwned.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-sky-300 transition-colors"
                >
                  haveibeenpwned.com
                </a>{' '}
                to check manually or add <span className="font-mono text-sky-300">HIBP_API_KEY</span> to your environment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
