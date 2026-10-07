import { useState } from 'react';
import { ShieldCheck, Search, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { useLanguage } from '../i18n';

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
  if (!grade) return 'text-muted';
  if (grade === 'A+' || grade === 'A') return 'text-emerald-700';
  if (grade === 'B') return 'text-brand';
  if (grade === 'C') return 'text-amber-700';
  return 'text-red-700';
}

function gradeBg(grade: string | null): string {
  if (!grade) return 'bg-sunken border-line-strong';
  if (grade === 'A+' || grade === 'A') return 'bg-emerald-50 border-emerald-200';
  if (grade === 'B') return 'bg-brand-soft border-brand/25';
  if (grade === 'C') return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export default function SslCheckerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SslResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  async function handleCheck(domain = input) {
    const trimmed = domain.trim();
    if (!trimmed) { setError(t('enterDomainCheck')); return; }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await apiPost<SslResult>('/api/ssl-check', { domain: trimmed });
      if (res.data && 'status' in res.data) setResult(res.data);
      else setError(apiErrorOf(res) ?? t('checkFailed'));
    } catch (err) {
      setError(errorMessage(err, 'Check failed — verify your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }

  const statusColor = result?.status === 'valid'
    ? 'text-emerald-700'
    : result?.status === 'expiring'
    ? 'text-amber-700'
    : 'text-red-700';

  const statusBg = result?.status === 'valid'
    ? 'bg-emerald-50 border-emerald-200'
    : result?.status === 'expiring'
    ? 'bg-amber-50 border-amber-200'
    : 'bg-red-50 border-red-200';

  const statusLabel: Record<string, string> = {
    valid: t('certificateValid'),
    expiring: t('expiringSoon'),
    invalid: t('certificateInvalid'),
    pending: t('analysisInProgress'),
    error: t('checkFailedLabel'),
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<ShieldCheck className="w-5 h-5 text-brand" />}
        title={t('sslTitle')}
        description={t('sslDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-ink-2">{t('domain')}</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="e.g. github.com"
              dir="ltr" className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
            />
            <button
              onClick={() => handleCheck()}
              disabled={loading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <p className="text-xs text-faint">{t('sslHint')}</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Main status */}
            <div className={`flex items-center justify-between rounded-xl border px-5 py-4 ${
              result.status === 'pending' || result.status === 'error'
                ? 'bg-sunken border-line-strong'
                : statusBg
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 shrink-0 ${
                  result.status === 'pending' || result.status === 'error' ? 'text-muted' : statusColor
                }`} />
                <div>
                  <p className={`font-semibold text-sm ${
                    result.status === 'pending' || result.status === 'error' ? 'text-ink-2' : statusColor
                  }`}>
                    {statusLabel[result.status] ?? result.status}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{result.domain}</p>
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
              <div className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3">
                <p className="text-muted text-sm">{result.errorMessage}</p>
                {result.status === 'pending' && (
                  <button
                    onClick={() => handleCheck(result.domain)}
                    disabled={loading}
                    className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-strong border border-brand/30 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t('retry')}
                  </button>
                )}
              </div>
            )}

            {/* Details */}
            {(result.daysRemaining !== null || result.issuer) && (
              <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
                <p className="text-sm font-semibold text-ink-2">{t('certificateDetails')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.daysRemaining !== null && (
                    <div className="bg-sunken rounded-lg p-3 border border-line-strong">
                      <p className="text-xs text-muted mb-1">{t('expiresIn')}</p>
                      <p className={`text-sm font-bold ${
                        result.daysRemaining <= 0 ? 'text-red-700'
                        : result.daysRemaining <= 30 ? 'text-amber-700'
                        : 'text-emerald-700'
                      }`}>
                        {result.daysRemaining <= 0
                          ? t('expired')
                          : `${result.daysRemaining} ${t('days')}`}
                      </p>
                    </div>
                  )}
                  {result.expiryDate && (
                    <div className="bg-sunken rounded-lg p-3 border border-line-strong">
                      <p className="text-xs text-muted mb-1">{t('expiryDate')}</p>
                      <p className="text-sm font-medium text-ink">
                        {new Date(result.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {result.issuer && (
                    <div className="bg-sunken rounded-lg p-3 border border-line-strong sm:col-span-2">
                      <p className="text-xs text-muted mb-1">{t('certificateAuthority')}</p>
                      <p className="text-sm font-medium text-ink truncate">{result.issuer}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grade explanation */}
            {result.grade && (
              <div className="bg-surface border border-line rounded-xl p-4">
                <p className="text-xs text-muted leading-relaxed">
                  <span className="text-muted font-medium">{t('sslGrades')}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
