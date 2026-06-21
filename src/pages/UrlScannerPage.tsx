import { useState } from 'react';
import { Globe, Search, Loader2 } from 'lucide-react';
import { checkUrlWithVT, VTUrlResult } from '../utils/virusTotalApi';
import PageHeader from '../components/PageHeader';
import { VTVerdictCard, VTEngineBreakdown } from '../components/VTVerdict';

export default function UrlScannerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VTUrlResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleScan() {
    const trimmed = input.trim();
    if (!trimmed) { setError('Please enter a URL or domain to scan.'); return; }
    setError('');
    setResult(null);
    setLoading(true);

    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      const res = await checkUrlWithVT(url);
      setResult(res);
    } catch {
      setError('Scan failed — check your connection.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<Globe className="w-5 h-5 text-sky-400" />}
        title="URL Scanner"
        description="Check any URL or domain against VirusTotal's 90+ security engines"
      />

      <div className="max-w-2xl mx-auto px-8 py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">URL or Domain</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              placeholder="e.g. evil-login.xyz or https://phishing.example.com"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
            />
            <button
              onClick={handleScan}
              disabled={loading}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Scan
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-xs text-slate-600">Protocol (https://) is added automatically if missing. Press Enter to scan.</p>
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
