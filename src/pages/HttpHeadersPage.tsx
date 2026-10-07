import { useState } from 'react';
import { Layers, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DomainCheckForm from '../components/DomainCheckForm';
import { FindingList, GradeCard } from '../components/AuditResult';
import { findingsText } from '../utils/findingsStyle';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { isHttpHeadersInconclusive, scoreHttpHeaders, type HttpHeadersData } from '../utils/httpHeadersScore';
import { updateSession, useAuditSession } from '../utils/auditSession';
import { useLanguage } from '../i18n';

export default function HttpHeadersPage() {
  const session = useAuditSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const { t } = useLanguage();

  const data = session.httpHeaders;
  const inconclusive = data ? isHttpHeadersInconclusive(data) : false;
  const score = data && !inconclusive ? scoreHttpHeaders(data) : null;

  async function handleCheck(domain: string) {
    setError('');
    setLoading(true);
    updateSession({ domain, httpHeaders: null });
    try {
      const res = await apiPost<HttpHeadersData>('/api/http-headers', { domain });
      if (res.ok && res.data && 'https' in res.data) updateSession({ httpHeaders: res.data, domain: res.data.domain });
      else setError(apiErrorOf(res) ?? t('httpFailed'));
    } catch (err) {
      setError(errorMessage(err, t('serverFailed')));
    } finally {
      setLoading(false);
    }
  }

  const headers = data ? Object.entries(data.https.headers) : [];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<Layers className="w-5 h-5" />}
        title={t('httpTitle')}
        description={t('httpDesc')}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <DomainCheckForm
          id="headers-domain"
          initialValue={session.domain}
          loading={loading}
          error={error}
          hint={t('httpHint')}
          buttonLabel={t('check')}
          onSubmit={handleCheck}
        />

        {data && (
          <div className="space-y-4 animate-fade-in">
            {inconclusive ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-amber-800">{t('websiteUnreachable')}</p>
                    <p className="text-sm text-amber-800/80 mt-1">{t('websiteUnreachableDesc')}</p>
                  </div>
                  <div className="shrink-0 rounded-xl border-2 border-amber-300 bg-white px-4 py-2 text-xl font-bold text-amber-800">{t('notApplicable')}</div>
                </div>
                <div className="text-sm text-amber-900 space-y-1 pt-1">
                  <p>{t('httpsInconclusive')}</p>
                  <p>{t('headersNotEvaluated')}</p>
                </div>
              </div>
            ) : score ? (
              <>
            <GradeCard
          <div className="space-y-4 animate-fade-in">
            <GradeCard
              subject={data.https.finalUrl ?? data.domain}
              score={score}
              copyText={findingsText(`Website security headers — ${data.domain}`, data.checkedAt, score, [
                'Response headers',
                ...headers.map(([k, v]) => `  ${k}: ${v}`),
              ])}
            />
            <FindingList findings={score.findings} />
              </>
            ) : null}

            <div className="rounded-xl border border-line bg-surface">
              <button
                onClick={() => setShowRaw(!showRaw)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-2"
                aria-expanded={showRaw}
              >
                {t('rawHeaders')}
                <ChevronDown className={`w-4 h-4 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
              </button>
              {showRaw && (
                <div className="space-y-3 border-t border-line px-4 py-3 text-xs">
                  <ol className="space-y-1 font-mono text-ink-2">
                    {data.https.chain.map((hop) => (
                      <li key={hop.url} className="break-all">
                        <span className="text-muted">{hop.status}</span> {hop.url}
                      </li>
                    ))}
                    {data.http.status !== null && (
                      <li className="break-all">
                        <span className="text-muted">{data.http.status}</span> http://{data.domain}/
                        {data.http.location ? ` → ${data.http.location}` : ''}
                      </li>
                    )}
                  </ol>
                  <dl className="space-y-2">
                    {headers.length === 0 && <p className="text-muted">{t('noHeaders')}</p>}
                    {headers.map(([k, v]) => (
                      <div key={k} className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] gap-x-2">
                        <dt className="text-muted">{k}</dt>
                        <dd className="whitespace-pre-wrap break-all font-mono text-ink-2">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
