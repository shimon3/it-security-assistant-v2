import { useState } from 'react';
import { Globe, Search, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { VTVerdictCard, VTEngineBreakdown } from '../components/VTVerdict';

interface IpResult {
  ip: string;
  country: string | null;
  asOwner: string | null;
  asn: number | null;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: 'clean' | 'suspicious' | 'malicious' | 'error';
  errorMessage?: string;
}

export default function IpLookupPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<IpResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    const trimmed = input.trim();
    if (!trimmed) { setError('Please enter an IP address.'); return; }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await apiPost<IpResult>('/api/vt-ip', { ip: trimmed });
      if (res.data && 'status' in res.data) setResult(res.data);
      else setError(apiErrorOf(res) ?? 'Lookup failed — check your connection and try again.');
    } catch (err) {
      setError(errorMessage(err, 'Lookup failed — check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Globe className="w-5 h-5 text-brand" />}
        title="IP Lookup"
        description="Check IP address reputation via VirusTotal"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-ink-2">IP Address</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="e.g. 8.8.8.8"
              className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
            />
            <button
              onClick={handleLookup}
              disabled={loading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </button>
          </div>
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <p className="text-xs text-faint">Press Enter to look up. Supports IPv4 and IPv6 addresses.</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <VTVerdictCard
              status={result.status}
              label={result.ip}
              malicious={result.malicious}
              suspicious={result.suspicious}
              total={result.total}
              errorMessage={result.errorMessage}
            />

            {/* IP Details */}
            <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-ink-2">IP Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-sunken rounded-lg p-3 border border-line-strong">
                  <p className="text-xs text-muted mb-1">Country</p>
                  <p className="text-sm font-medium text-ink">{result.country ?? '—'}</p>
                </div>
                <div className="bg-sunken rounded-lg p-3 border border-line-strong">
                  <p className="text-xs text-muted mb-1">ASN</p>
                  <p className="text-sm font-medium text-ink">{result.asn != null ? `AS${result.asn}` : '—'}</p>
                </div>
                <div className="bg-sunken rounded-lg p-3 border border-line-strong col-span-2 sm:col-span-1">
                  <p className="text-xs text-muted mb-1">AS Owner</p>
                  <p className="text-sm font-medium text-ink truncate">{result.asOwner ?? '—'}</p>
                </div>
              </div>
            </div>

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
