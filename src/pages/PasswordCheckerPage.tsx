import { useMemo, useState } from 'react';
import { Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import zxcvbn from 'zxcvbn';
import PageHeader from '../components/PageHeader';

function cryptoRandIndex(n: number): number {
  const limit = Math.floor(0xFFFFFFFF / n) * n;
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return value % n;
}

function generatePassword(length = 18): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const all = lower + upper + digits + special;

  const required = [
    lower[cryptoRandIndex(lower.length)],
    upper[cryptoRandIndex(upper.length)],
    digits[cryptoRandIndex(digits.length)],
    special[cryptoRandIndex(special.length)],
  ];
  const rest = Array.from({ length: length - 4 }, () => all[cryptoRandIndex(all.length)]);
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = cryptoRandIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

const SCORE = [
  { label: 'Very weak', text: 'text-red-700', bar: 'bg-red-600' },
  { label: 'Weak', text: 'text-orange-700', bar: 'bg-orange-600' },
  { label: 'Fair', text: 'text-amber-700', bar: 'bg-amber-600' },
  { label: 'Strong', text: 'text-sky-700', bar: 'bg-sky-600' },
  { label: 'Very strong', text: 'text-emerald-700', bar: 'bg-emerald-600' },
] as const;

export default function PasswordCheckerPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => (password ? zxcvbn(password) : null), [password]);
  const style = result ? SCORE[result.score] : SCORE[0];
  const barWidth = result ? `${((result.score + 1) / 5) * 100}%` : '0%';

  function handleGenerate() {
    setGeneratedPassword(generatePassword());
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Lock className="w-5 h-5 text-brand" />}
        title="Password strength"
        description="Realistic password analysis using zxcvbn pattern matching, plus a secure local generator."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-2">Password to evaluate</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type a password..."
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
            <p className="text-xs text-faint">The password stays in this browser. It is not sent to the server.</p>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className={`font-bold text-lg ${style.text}`}>{style.label}</span>
                  <span className="text-xs text-muted">zxcvbn score {result.score}/4</span>
                </div>
                <div className="h-2.5 bg-sunken rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                    style={{ width: barWidth }}
                  />
                </div>
                <div className="flex justify-between text-xs text-faint">
                  <span>Very weak</span>
                  <span>Very strong</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface border border-line rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Offline fast attack estimate</p>
                  <p className={`font-bold text-base ${style.text}`}>
                    {result.crack_times_display.offline_fast_hashing_1e10_per_second}
                  </p>
                </div>
                <div className="bg-surface border border-line rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Online throttled estimate</p>
                  <p className="font-bold text-base text-ink">
                    {result.crack_times_display.online_throttling_100_per_hour}
                  </p>
                </div>
              </div>

              {(result.feedback.warning || result.feedback.suggestions.length > 0) && (
                <div className="bg-surface border border-line rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-ink-2 mb-3">Why this score?</p>
                  {result.feedback.warning && (
                    <p className="text-sm text-amber-800">{result.feedback.warning}</p>
                  )}
                  {result.feedback.suggestions.map((suggestion) => (
                    <div key={suggestion} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-amber-700 mt-0.5 shrink-0">→</span>
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.score === 4 && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  ✓ Strong against the common patterns zxcvbn checks.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-line" />

        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Password generator</h2>
            <p className="text-muted text-sm mt-1">Generate an 18-character password with the browser cryptographic random generator.</p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-sunken hover:bg-line border border-line-strong text-ink font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Generate password
          </button>

          {generatedPassword && (
            <div className="bg-surface border border-line rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="font-mono text-base text-brand-strong break-all tracking-wide" dir="ltr">
                {generatedPassword}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-faint">18 characters · upper + lower + digits + symbols</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-muted hover:text-ink border border-line-strong px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? <span className="text-emerald-700">✓ Copied</span> : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
