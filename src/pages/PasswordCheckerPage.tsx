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
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<Lock className="w-5 h-5 text-sky-400" />}
        title="Password Strength"
        description="Evaluate your password security and generate strong alternatives"
      />

      <div className="max-w-2xl mx-auto px-8 py-8 space-y-8">

        {/* Checker */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Enter Password to Evaluate</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Type your password here..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-600">Your password is never sent anywhere — analysis runs entirely in your browser.</p>
          </div>

          {result && (
            <div className="space-y-4 animate-fade-in">
              {/* Score bar */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-lg ${result.color}`}>{result.label}</span>
                  <span className="text-xs text-slate-500">{result.entropy} bits of entropy</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${result.barColor}`}
                    style={{ width: barWidth }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Very Weak</span>
                  <span>Very Strong</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Time to crack (GPU)</p>
                  <p className={`font-bold text-base ${result.color}`}>{result.timeToCrack}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Entropy</p>
                  <p className="font-bold text-base text-slate-200">{result.entropy} bits</p>
                </div>
              </div>

              {/* Feedback */}
              {result.feedback.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-slate-300 mb-3">Suggestions</p>
                  {result.feedback.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                      {f}
                    </div>
                  ))}
                </div>
              )}

              {result.score === 4 && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  ✓ Excellent password — no improvements needed
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800" />

        {/* Generator */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white">Password Generator</h2>
            <p className="text-slate-500 text-sm mt-1">Generate a cryptographically strong 18-character password</p>
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Generate Password
          </button>

          {generatedPassword && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 animate-fade-in">
              <div className="font-mono text-base text-sky-300 break-all tracking-wide">
                {generatedPassword}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">18 characters · Upper + Lower + Digits + Symbols</span>
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
                >
                  {copied ? <span className="text-emerald-400">✓ Copied!</span> : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
