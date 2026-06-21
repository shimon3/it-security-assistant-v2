import { useState } from 'react';
import { Shield, Search, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { VTVerdictCard, VTEngineBreakdown } from '../components/VTVerdict';

interface DomainResult {
  domain: string;
  registrar: string | null;
  creationDate: number | null;
  categories: string[];
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: 'clean' | 'suspicious' | 'malicious' | 'error';
  errorMessage?: string;
}

function extractDomain(input: string): string {
  let s = input.trim();
  // Strip protocol
  s = s.replace(/^https?:\/\//i, '');
  // Strip path/query
  s = s.split('/')[0];
  // Strip port
  s = s.split(':')[0];
  return s.toLowerCase();
}

export default function DomainWhoisPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<DomainResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    const trimmed = input.trim();
    if (!trimmed) { setError('Please enter a domain or URL.'); return; }
    const domain = extractDomain(trimmed);
    if (!domain) { setError('Could not parse a domain from your input.'); return; }
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch('/api/vt-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data: DomainResult = await res.json();
      setResult(data);
    } catch {
      setError('Lookup failed — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<Shield className="w-5 h-5 text-sky-400" />}
        title="Domain WHOIS"
        description="Lookup domain registration info and threat reputation"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Domain or URL</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="e.g. suspicious-site.xyz"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
            />
            <button
              onClick={handleLookup}
              disabled={loading}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Lookup
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-xs text-slate-600">Press Enter to look up. The protocol and path are stripped automatically.</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <VTVerdictCard
              status={result.status}
              label={result.domain}
              malicious={result.malicious}
              suspicious={result.suspicious}
              total={result.total}
              errorMessage={result.errorMessage}
            />

            {/* Domain Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-300">Domain Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Registrar</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{result.registrar ?? '—'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Creation Date</p>
                  <p className="text-sm font-medium text-slate-200">
                    {result.creationDate != null
                      ? new Date(result.creationDate * 1000).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>

              {result.categories.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {result.categories.map((cat) => (
                      <span
                        key={cat}
                        className="text-xs font-medium text-sky-400 bg-sky-400/10 border border-sky-400/20 px-2.5 py-1 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
