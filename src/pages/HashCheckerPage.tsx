import { useState } from 'react';
import { Hash, Search, Loader2, FileSearch } from 'lucide-react';
import { checkHashWithVT, VTFileResult } from '../utils/virusTotalApi';
import PageHeader from '../components/PageHeader';
import { VTVerdictCard, VTEngineBreakdown } from '../components/VTVerdict';

function detectHashType(hash: string): string | null {
  const h = hash.trim();
  if (/^[a-fA-F0-9]{32}$/.test(h)) return 'MD5';
  if (/^[a-fA-F0-9]{40}$/.test(h)) return 'SHA-1';
  if (/^[a-fA-F0-9]{64}$/.test(h)) return 'SHA-256';
  return null;
}

export default function HashCheckerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VTFileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hashType = detectHashType(input);

  async function handleCheck() {
    const hash = input.trim();
    if (!hash) { setError('Please enter a file hash.'); return; }
    if (!detectHashType(hash)) { setError('Invalid hash — enter a valid MD5 (32), SHA-1 (40) or SHA-256 (64) hex string.'); return; }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await checkHashWithVT(hash);
      setResult(res);
    } catch {
      setError('Check failed — verify your connection.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Hash className="w-5 h-5 text-brand" />}
        title="Hash Checker"
        description="Verify if a file is malicious by checking its hash against VirusTotal"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-2">File Hash</label>
            {hashType && (
              <span className="text-xs font-mono text-brand bg-brand-soft border border-brand/25 px-2 py-0.5 rounded">
                {hashType} detected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="MD5, SHA-1 or SHA-256 hash"
              className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm font-mono"
            />
            <button
              onClick={handleCheck}
              disabled={loading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Check
            </button>
          </div>
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <p className="text-xs text-faint">Supported: MD5 (32 chars), SHA-1 (40 chars), SHA-256 (64 chars)</p>
        </div>

        {result && (
          <div className="space-y-4 animate-fade-in">
            <VTVerdictCard
              status={result.status}
              label={result.hash}
              malicious={result.malicious}
              suspicious={result.suspicious}
              total={result.total}
              errorMessage={result.errorMessage}
            >
              {(result.fileName || result.fileType) && (
                <div className="mt-1 ml-8">
                  {result.fileName && <p className="text-muted text-sm">{result.fileName}</p>}
                  {result.fileType && <p className="text-muted text-xs mt-0.5">{result.fileType}</p>}
                </div>
              )}
              <div className="mt-3 font-mono text-xs text-faint break-all bg-sunken px-3 py-2 rounded-lg border border-line">
                {result.hash}
              </div>
            </VTVerdictCard>

            {result.total > 0 && (
              <VTEngineBreakdown
                malicious={result.malicious}
                suspicious={result.suspicious}
                harmless={result.harmless}
                undetected={result.undetected}
                headerIcon={<FileSearch className="w-4 h-4 text-muted" />}
              />
            )}

            {/* Threat names */}
            {result.threatNames.length > 0 && (
              <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
                <p className="text-sm font-semibold text-ink-2">Identified Threats</p>
                <div className="flex flex-wrap gap-2">
                  {result.threatNames.map((name, i) => (
                    <span key={i} className="text-xs font-mono text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
