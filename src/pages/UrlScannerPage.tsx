import { useState, useEffect } from 'react';
import { Globe, Search, Loader2 } from 'lucide-react';
import { checkUrlWithVT, VTUrlResult } from '../utils/virusTotalApi';
import PageHeader from '../components/PageHeader';
import { VTVerdictCard, VTEngineBreakdown } from '../components/VTVerdict';
import { useLanguage } from '../i18n';

interface UrlScannerPageProps {
  initialUrl?: string;
  onUrlConsumed?: () => void;
}

export default function UrlScannerPage({ initialUrl = '', onUrlConsumed }: UrlScannerPageProps) {
  const [input, setInput] = useState(initialUrl);
  const [result, setResult] = useState<VTUrlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  useEffect(() => {
    if (initialUrl) {
      setInput(initialUrl);
      setResult(null);
      setError('');
      onUrlConsumed?.();
    }
  }, [initialUrl, onUrlConsumed]);

  async function handleScan() {
    const trimmed = input.trim();
    if (!trimmed) { setError(t('enterUrl')); return; }
    setError('');
    setResult(null);
    setLoading(true);

    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      const res = await checkUrlWithVT(url);
      setResult(res);
    } catch {
      setError(t('scanFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Globe className="w-5 h-5 text-brand" />}
        title={t('urlScannerTitle')}
        description={t('urlScannerDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {initialUrl && (
          <div className="flex items-center gap-2 text-xs text-brand bg-brand-soft border border-brand/25 rounded-lg px-3 py-2">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {t('qrImported')}
          </div>
        )}
        <div className="space-y-3">
          <label className="text-sm font-medium text-ink-2">{t('urlOrDomain')}</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="e.g. evil-login.xyz or https://phishing.example.com"
              dir="ltr" className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Scan
            </button>
          </div>
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <p className="text-xs text-faint">Protocol (https://) is added automatically if missing. Press Enter to scan.</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <VTVerdictCard
              status={result.status}
              label={result.url}
              malicious={result.malicious}
              suspicious={result.suspicious}
              total={result.total}
              errorMessage={result.errorMessage}
            />

            {result.total > 0 && (
              <VTEngineBreakdown
                malicious={result.malicious}
                suspicious={result.suspicious}
                harmless={result.harmless}
                undetected={result.undetected}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
