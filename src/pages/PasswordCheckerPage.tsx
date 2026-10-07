import { useState } from 'react';
import { Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { checkPasswordStrength } from '../utils/passwordChecker';
import PageHeader from '../components/PageHeader';

function cryptoRandIndex(n: number): number {
  const limit = Math.floor(0xFFFFFFFF / n) * n;
  let value: number;
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (value >= limit);
  return value % n;
}

function generatePassword(length = 16): string {
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

  const rest = Array.from({ length: length - 4 }, () =>
    all[cryptoRandIndex(all.length)]
  );

  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = cryptoRandIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export default function PasswordCheckerPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const result = password ? checkPasswordStrength(password) : null;

  function handleGenerate() {
    const pwd = generatePassword(18);
    setGeneratedPassword(pwd);
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const barWidth = result ? `${(result.score / 4) * 100}%` : '0%';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Lock className="w-5 h-5 text-brand" />}
        title="Password Strength"
        description="Evaluate your password security and generate strong alternatives"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">

        {/* Checker */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-ink-2">Enter Password to Evaluate</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password here..."
                className="w-full bg-surface border border-line rounded-xl px-4 py-3 pr-11 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink-2 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-faint">Your password is never sent anywhere — analysis runs entirely in your browser.</p>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              {/* Score bar */}
              <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-lg ${result.color}`}>{result.label}</span>
                  <span className="text-xs text-muted">{result.entropy} bits of entropy</span>
                </div>
                <div className="h-2.5 bg-sunken rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${result.barColor}`}
                    style={{ width: barWidth }}
                  />
                </div>
                <div className="flex justify-between text-xs text-faint">
                  <span>Very Weak</span>
                  <span>Very Strong</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface border border-line rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Time to crack (GPU)</p>
                  <p className={`font-bold text-base ${result.color}`}>{result.timeToCrack}</p>
                </div>
                <div className="bg-surface border border-line rounded-xl p-4">
                  <p className="text-xs text-muted mb-1">Entropy</p>
                  <p className="font-bold text-base text-ink">{result.entropy} bits</p>
                </div>
              </div>

              {/* Feedback */}
              {result.feedback.length > 0 && (
                <div className="bg-surface border border-line rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-ink-2 mb-3">Suggestions</p>
                  {result.feedback.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted">
                      <span className="text-amber-700 mt-0.5 shrink-0">→</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}

              {result.score === 4 && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  ✓ Excellent password — no improvements needed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Generator */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Password Generator</h2>
            <p className="text-muted text-sm mt-1">Generate a cryptographically strong 18-character password</p>
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-sunken hover:bg-line border border-line-strong hover:border-line-strong text-ink font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Password
          </button>

          {generatedPassword && (
            <div className="bg-surface border border-line rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="font-mono text-base text-brand-strong break-all tracking-wide">
                {generatedPassword}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-faint">18 characters · Upper + Lower + Digits + Symbols</span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-muted hover:text-ink border border-line-strong hover:border-line-strong px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? <span className="text-emerald-700">✓ Copied!</span> : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
