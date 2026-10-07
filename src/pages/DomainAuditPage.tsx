import { useState } from 'react';
import { MailCheck, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DomainCheckForm from '../components/DomainCheckForm';
import { FindingList, GradeCard } from '../components/AuditResult';
import { findingsText } from '../utils/findingsStyle';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { scoreDomain, type DomainAuditData } from '../utils/domainScore';
import { updateSession, useAuditSession } from '../utils/auditSession';
import { useLanguage } from '../i18n';

function rawLines(data: DomainAuditData): string[] {
  return [
    'Raw records',
    `  MX: ${data.mx.join(' | ') || '—'}`,
    `  SPF: ${data.spf.records.join(' | ') || '—'}${data.spf.lookups !== null ? ` (${data.spf.lookups} DNS lookups)` : ''}`,
    `  DMARC: ${data.dmarc.records.join(' | ') || '—'}`,
    `  DKIM selectors found: ${data.dkim.found.map((f) => f.selector).join(', ') || 'none'}`,
    `  DNSSEC: ${data.dnssec ? 'yes' : 'no'}   MTA-STS: ${data.mtaSts ? 'yes' : 'no'}   TLS-RPT: ${data.tlsRpt ? 'yes' : 'no'}`,
  ];
}

export default function DomainAuditPage() {
  const session = useAuditSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const { t } = useLanguage();

  const data = session.domainAudit;
  const score = data ? scoreDomain(data) : null;

  async function handleAudit(domain: string) {
    setError('');
    setLoading(true);
    updateSession({ domain, domainAudit: null });
    try {
      const res = await apiPost<DomainAuditData>('/api/domain-audit', { domain });
      if (res.ok && res.data && 'mx' in res.data) updateSession({ domainAudit: res.data, domain: res.data.domain });
      else setError(apiErrorOf(res) ?? t('auditFailed'));
    } catch (err) {
      setError(errorMessage(err, t('serverFailed')));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<MailCheck className="w-5 h-5" />}
        title={t('auditDomainTitle')}
        description={t('auditDomainDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <DomainCheckForm
          id="audit-domain"
          initialValue={session.domain}
          loading={loading}
          error={error}
          hint={t('auditDomainHint')}
          buttonLabel={t('audit')}
          onSubmit={handleAudit}
        />

        {data && score && (
          <div className="space-y-4 animate-fade-in">
            {!data.exists && (
              <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                {t('domainMissing')}
              </p>
            )}

            <GradeCard
              subject={data.domain}
              score={score}
              copyText={findingsText(`Email security audit — ${data.domain}`, data.checkedAt, score, rawLines(data))}
            />
            <FindingList findings={score.findings} />

            <div className="rounded-xl border border-line bg-surface">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-2"
                aria-expanded={showRaw}
              >
                {t('rawDns')}
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
