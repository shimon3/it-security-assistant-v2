import { useState } from 'react';
import { MailCheck, Search, Loader2, ChevronDown, Copy, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { scoreDomain, type DomainAuditData, type DomainScore, type Severity } from '../utils/domainScore';

const GRADE_STYLE: Record<DomainScore['grade'], string> = {
  A: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  B: 'text-lime-300 border-lime-500/40 bg-lime-500/10',
  C: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  D: 'text-orange-300 border-orange-500/40 bg-orange-500/10',
  E: 'text-red-300 border-red-500/40 bg-red-500/10',
};

const SEVERITY_STYLE: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-red-300 bg-red-500/10 border-red-500/30' },
  high: { label: 'High', cls: 'text-orange-300 bg-orange-500/10 border-orange-500/30' },
  medium: { label: 'Medium', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  low: { label: 'Low', cls: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  ok: { label: 'OK', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
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
    `  DNSSEC: ${data.dnssec ? 'yes' : 'no'}  MTA-STS: ${data.mtaSts ? 'yes' : 'no'}  TLS-RPT: ${data.tlsRpt ? 'yes' : 'no'}`,
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
    <div className="min-h-screen bg-slate-950 text-white">
      <PageHeader
        icon={<MailCheck className="w-5 h-5 text-sky-400" />}
        title="Domain Email Security"
        description="Can someone send email in this company's name? SPF, DMARC, DKIM and more, from public DNS."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="space-y-3">
          <label htmlFor="audit-domain" className="text-sm font-medium text-slate-300">Domain</label>
          <div className="flex gap-3">
            <input
              id="audit-domain"
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAudit()}
              placeholder="e.g. company.co.il"
              className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all text-sm"
            />
            <button
              onClick={handleAudit}
              disabled={loading}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition-all text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Audit
            </button>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <p className="text-xs text-slate-600">Reads public DNS records only. Allowed in audit mode.</p>
        </div>

        {data && score && (
          <div className="space-y-4 animate-fade-in">
            {!data.exists && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                This domain does not seem to exist. Check the spelling.
              </p>
            )}

            <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-3xl font-bold ${GRADE_STYLE[score.grade]}`}>
                {score.grade}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-400">{data.domain}</p>
                <p className="text-lg font-semibold text-white">{score.score}/100</p>
                <p className="text-xs text-slate-500">
                  {score.findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length} serious problem(s)
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 px-3 py-1.5 rounded-lg transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <ul className="space-y-3">
              {score.findings.map((f) => (
                <li key={f.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[f.severity].cls}`}>
                      {SEVERITY_STYLE[f.severity].label}
                    </span>
                    <span className="shrink-0 rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-400">{f.control}</span>
                    <p className="text-sm font-medium text-slate-200">{f.title}</p>
                  </div>
                  {f.severity !== 'ok' && (
                    <>
                      <p className="text-sm text-slate-400">{f.impact}</p>
                      <p className="text-sm text-slate-300"><span className="text-slate-500">Fix: </span>{f.recommendation}</p>
                    </>
                  )}
                  {f.detail && (
                    <pre className="whitespace-pre-wrap break-all rounded-lg bg-slate-950 px-3 py-2 text-xs text-slate-500">{f.detail}</pre>
                  )}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-slate-800 bg-slate-900">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-300"
                aria-expanded={showRaw}
              >
                Raw DNS records
                <ChevronDown className={`w-4 h-4 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
              </button>
              {showRaw && (
                <dl className="space-y-2 border-t border-slate-800 px-4 py-3 text-xs">
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
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="whitespace-pre-wrap break-all font-mono text-slate-300">{v || '—'}</dd>
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
