import { useState } from 'react';
import { MailCheck, Search, Loader2, ChevronDown, Copy, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { scoreDomain, type DomainAuditData, type DomainScore, type Severity } from '../utils/domainScore';

const GRADE_STYLE: Record<DomainScore['grade'], string> = {
  A: 'text-emerald-700 border-emerald-500 bg-emerald-50',
  B: 'text-lime-700 border-lime-500 bg-lime-50',
  C: 'text-amber-700 border-amber-500 bg-amber-50',
  D: 'text-orange-700 border-orange-500 bg-orange-50',
  E: 'text-red-700 border-red-500 bg-red-50',
};

const SEVERITY_STYLE: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-red-700 bg-red-50 border-red-300' },
  high: { label: 'High', cls: 'text-orange-700 bg-orange-50 border-orange-300' },
  medium: { label: 'Medium', cls: 'text-amber-700 bg-amber-50 border-amber-300' },
  low: { label: 'Low', cls: 'text-brand-strong bg-brand-soft border-brand/30' },
  ok: { label: 'OK', cls: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
};

function summaryText(data: DomainAuditData, s: DomainScore): string {
  const lines = [
    `Email security audit — ${data.domain}`,
    `Checked: ${new Date(data.checkedAt).toLocaleString()}`,
    `Grade: ${s.grade} (${s.score}/100)`,
    '',
    ...s.findings
      .filter((f) => f.severity !== 'ok')
      .flatMap((f) => [`[${SEVERITY_STYLE[f.severity].label}] ${f.title}`, `  Impact: ${f.impact}`, `  Fix: ${f.recommendation}`, '']),
    'Raw records',
    `  MX: ${data.mx.join(' | ') || '—'}`,
    `  SPF: ${data.spf.records.join(' | ') || '—'}${data.spf.lookups !== null ? ` (${data.spf.lookups} DNS lookups)` : ''}`,
    `  DMARC: ${data.dmarc.records.join(' | ') || '—'}`,
    `  DKIM selectors found: ${data.dkim.found.map((f) => f.selector).join(', ') || 'none'}`,
    `  DNSSEC: ${data.dnssec ? 'yes' : 'no'} MTA-STS: ${data.mtaSts ? 'yes' : 'no'} TLS-RPT: ${data.tlsRpt ? 'yes' : 'no'}`,
  ];
  return lines.join('\n');
}

export default function DomainAuditPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<DomainAuditData | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const score = data ? scoreDomain(data) : null;

  async function handleAudit() {
    if (!input.trim()) { setError('Please enter a domain.'); return; }
    setError('');
    setData(null);
    setLoading(true);
    try {
      const res = await apiPost<DomainAuditData>('/api/domain-audit', { domain: input.trim() });
      if (res.ok && res.data && 'domain' in res.data) setData(res.data);
      else setError(apiErrorOf(res) ?? 'Audit failed — try again.');
    } catch (err) {
      setError(errorMessage(err, 'Audit failed — check your connection and try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!data || !score) return;
    await navigator.clipboard.writeText(summaryText(data, score));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<MailCheck className="w-5 h-5 text-brand" />}
        title="Domain Email Security"
        description="Can someone send email in this company's name? SPF, DMARC, DKIM and more, from public DNS."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label htmlFor="audit-domain" className="text-sm font-medium text-ink-2">Domain</label>
          <div className="flex gap-3">
            <input
              id="audit-domain"
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              placeholder="e.g. company.co.il"
              className="flex-1 min-w-0 bg-surface border border-line rounded-xl px-4 py-3 text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all text-sm"
            />
            <button
              onClick={handleAudit}
              disabled={loading}
              className="flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Audit
            </button>
          </div>
          {error && <p className="text-red-700 text-xs">{error}</p>}
          <p className="text-xs text-faint">Reads public DNS records only. Allowed in audit mode.</p>
        </div>

        {data && score && (
          <div className="space-y-4 animate-fade-in">
            {!data.exists && (
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                This domain does not seem to exist. Check the spelling.
              </p>
            )}

            <div className="flex items-center gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-[3px] text-5xl font-bold leading-none ${GRADE_STYLE[score.grade]}`}
                aria-label={`Grade ${score.grade}`}
              >
                {score.grade}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted truncate">{data.domain}</p>
                <p className="text-2xl font-semibold text-ink">{score.score} / 100</p>
                <p className="text-sm text-ink-2">
                  {score.findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length} serious problem(s)
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-ink border border-line hover:border-line-strong px-3 py-1.5 rounded-lg transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <ul className="space-y-3">
              {score.findings.map((f) => (
                <li key={f.id} className="rounded-xl border border-line bg-surface p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[f.severity].cls}`}>
                      {SEVERITY_STYLE[f.severity].label}
                    </span>
                    <span className="shrink-0 rounded-md border border-line-strong px-2 py-0.5 text-xs text-muted">{f.control}</span>
                    <p className="text-sm font-medium text-ink">{f.title}</p>
                  </div>
                  {f.severity !== 'ok' && (
                    <>
                      <p className="text-sm text-muted">{f.impact}</p>
                      <p className="text-sm text-ink-2"><span className="text-muted">Fix: </span>{f.recommendation}</p>
                    </>
                  )}
                  {f.detail && (
                    <pre className="whitespace-pre-wrap break-all rounded-md bg-sunken px-3 py-2 font-mono text-xs text-ink-2">{f.detail}</pre>
                  )}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-line bg-surface">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-2"
                aria-expanded={showRaw}
              >
                Raw DNS records
                <ChevronDown className={`w-4 h-4 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
              </button>
              {showRaw && (
                <dl className="space-y-2 border-t border-line px-4 py-3 text-xs">
                  {[
                    ['MX', data.mx.join('\n')],
                    ['SPF', data.spf.records.join('\n') + (data.spf.lookups !== null ? `\n(${data.spf.lookups} DNS lookups)` : '')],
                    ['DMARC', data.dmarc.records.join('\n')],
                    ['DKIM', data.dkim.found.map((k) => `${k.selector}: ${k.record.slice(0, 80)}…`).join('\n')],
                    ['MTA-STS', data.mtaSts ?? ''],
                    ['TLS-RPT', data.tlsRpt ?? ''],
                    ['DNSSEC', data.dnssec ? 'validated' : 'not validated'],
                  ].map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[5rem_1fr] gap-2">
                      <dt className="text-muted">{k}</dt>
                      <dd className="whitespace-pre-wrap break-all font-mono text-ink-2">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
