import { useState } from 'react';
import { ShieldCheck, Search, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';

interface SslResult {
  domain: string;
  status: 'valid' | 'expiring' | 'invalid' | 'pending' | 'error';
  grade: string | null;
  expiryDate: number | null;
  daysRemaining: number | null;
  issuer: string | null;
  errorMessage?: string;
}

function gradeColor(grade: string | null): string {
  if (!grade) return 'text-slate-400';
  if (grade === 'A+' || grade === 'A') return 'text-emerald-400';
  if (grade === 'B') return 'text-sky-400';
  if (grade === 'C') return 'text-amber-400';
  return 'text-red-400';
}

function gradeBg(grade: string | null): string {
  if (!grade) return 'bg-slate-800 border-slate-700';
  if (grade === 'A+' || grade === 'A') return 'bg-emerald-500/10 border-emerald-500/20';
  if (grade === 'B') return 'bg-sky-500/10 border-sky-500/20';
  if (grade === 'C') return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export default function SslCheckerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SslResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCheck(domain = input) {
    const trimmed = domain.trim();
    if (!trimmed) { setError('Please enter a domain to check.'); return; }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ssl-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: trimmed }),
      });
      if (!res.ok) throw new Error('Network error');
      const data: SslResult = await res.json();
      setResult(data);
    } catch {
      setError('Check failed — verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const statusColor = result?.status === 'valid'
    ? 'text-emerald-400'
    : result?.status === 'expiring'
    ? 'text-amber-400'
    : 'text-red-400';

  const statusBg = result?.status === 'valid'
    ? 'bg-emerald-500/10 border-emerald-500/20'
    : result?.status === 'expiring'
    ? 'bg-amber-500/10 border-amber-500/20'
    : 'bg-red-500/10 border-red-500/20';

  const statusLabel: Record<string, string> = {
    valid: 'Certificate Valid',
    expiring: 'Expiring Soon',
    invalid: 'Certificate Invalid',
    pending: 'Analysis in Progress',
    error: 'Check Failed',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<ShieldCheck className="w-5 h-5 text-sky-400" />}
        title="SSL/TLS Checker"
        description="Verify SSL certificate validity and grade via Qualys SSL Labs"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Domain</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="e.g. github.com"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
            />
            <button
              onClick={() => handleCheck()}
              disabled={loading}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-xs text-slate-600">Protocol is stripped automatically. Powered by Qualys SSL Labs.</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Main status */}
            <div className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
              result.status === 'pending' || result.status === 'error'
                ? 'bg-slate-800/50 border-slate-700'
                : statusBg
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 shrink-0 ${
                  result.status === 'pending' || result.status === 'error' ? 'text-slate-400' : statusColor
                }`} />
                <div>
                  <p className={`font-semibold text-sm ${
                    result.status === 'pending' || result.status === 'error' ? 'text-slate-300' : statusColor
                  }`}>
                    {statusLabel[result.status] ?? result.status}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{result.domain}</p>
                </div>
              </div>
              {result.grade && (
                <div className={`text-3xl font-black px-4 py-2 rounded-xl border ${gradeBg(result.grade)} ${gradeColor(result.grade)}`}>
                  {result.grade}
                </div>
              )}
            </div>

            {/* Error / pending message */}
            {result.errorMessage && (
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                <p className="text-slate-400 text-sm">{result.errorMessage}</p>
                {result.status === 'pending' && (
                  <button
                    onClick={() => handleCheck(result.domain)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* Details */}
            {(result.daysRemaining !== null || result.issuer) && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <p className="text-sm font-semibold text-slate-300">Certificate Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.daysRemaining !== null && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Expires in</p>
                      <p className={`text-sm font-bold ${
                        result.daysRemaining <= 0 ? 'text-red-400'
                        : result.daysRemaining <= 30 ? 'text-amber-400'
                        : 'text-emerald-400'
                      }`}>
                        {result.daysRemaining <= 0
                          ? 'Expired'
                          : `${result.daysRemaining} days`}
                      </p>
                    </div>
                  )}
                  {result.expiryDate && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-xs text-slate-500 mb-1">Expiry Date</p>
                      <p className="text-sm font-medium text-slate-200">
                        {new Date(result.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {result.issuer && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 sm:col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Certificate Authority</p>
                      <p className="text-sm font-medium text-slate-200 truncate">{result.issuer}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grade explanation */}
            {result.grade && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="text-slate-400 font-medium">SSL Labs grades: </span>
                  A+/A = excellent · B = minor issues · C = moderate issues · D/F = serious issues · T = untrusted cert
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
