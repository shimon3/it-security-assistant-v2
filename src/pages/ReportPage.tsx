import { useMemo, useState } from 'react';
import { FileText, Printer, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { GradeBadge } from '../components/AuditResult';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { updateSession, useAuditSession } from '../utils/auditSession';
import type { DomainAuditData } from '../utils/domainScore';
import type { HttpHeadersData } from '../utils/httpHeadersScore';
import { buildReport, formatDateHe, type Report, type ReportFinding } from '../utils/report';
import { EFFORT_HE, OWNER_HE, SEVERITY_HE } from '../utils/reportHe';
import { SEVERITY_STYLE } from '../utils/findingsStyle';
import { useLanguage } from '../i18n';

const PROFILE_KEY = 'itsa_consultant_profile';

interface ConsultantProfile {
  name: string;
  phone: string;
  email: string;
  website: string;
}

function loadProfile(): ConsultantProfile {
  const fallback = { name: 'Samuel', phone: '', email: '', website: '' };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveProfile(profile: ConsultantProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Contact details are a convenience only.
  }
}

const SECTION_HE = { email: 'אבטחת הדואר האלקטרוני', web: 'אבטחת האתר' } as const;

/** Hebrew text where "quoted" technical values are isolated left-to-right, so punctuation stays in place. */
function He({ text }: { text: string }) {
  const parts = text.split(/("[^"]+")/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('"') && part.endsWith('"') && part.length > 2 ? (
          <bdi key={i} dir="ltr" className="font-mono text-[0.9em] bg-sunken rounded px-1 [overflow-wrap:anywhere]">
            {part.slice(1, -1)}
          </bdi>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function ReportPage() {
  const session = useAuditSession();
  const [domain, setDomain] = useState(session.domain);
  const [clientName, setClientName] = useState(session.clientName);
  const [profile, setProfile] = useState<ConsultantProfile>(loadProfile);
  const { t } = useLanguage();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const sameDomain = (d: { domain: string } | null) => !!d && d.domain === domain.trim().toLowerCase();
  const domainAudit = sameDomain(session.domainAudit) ? session.domainAudit : null;
  const httpHeaders = sameDomain(session.httpHeaders) ? session.httpHeaders : null;
  const missing = !domainAudit || !httpHeaders;

  const report = useMemo(
    () => buildReport({ clientName, auditor: profile.name, domain, date: new Date(), domainAudit, httpHeaders }),
    [clientName, profile.name, domain, domainAudit, httpHeaders],
  );

  function updateProfile(patch: Partial<ConsultantProfile>) {
    setProfile((current) => {
      const next = { ...current, ...patch };
      saveProfile(next);
      return next;
    });
  }

  async function runChecks() {
    const d = domain.trim();
    if (!d) {
      setError(t('domainFirst'));
      return;
    }
    setError('');
    setRunning(true);
    updateSession({ domain: d, clientName });
    try {
      const [a, h] = await Promise.all([
        domainAudit ? null : apiPost<DomainAuditData>('/api/domain-audit', { domain: d }),
        httpHeaders ? null : apiPost<HttpHeadersData>('/api/http-headers', { domain: d }),
      ]);
      const patch: Parameters<typeof updateSession>[0] = {};
      if (a) {
        if (a.ok && a.data && 'mx' in a.data) patch.domainAudit = a.data;
        else setError(apiErrorOf(a) ?? t('auditFailed'));
      }
      if (h) {
        if (h.ok && h.data && 'https' in h.data) patch.httpHeaders = h.data;
        else setError(apiErrorOf(h) ?? t('httpFailed'));
      }
      const resolved = patch.domainAudit?.domain ?? patch.httpHeaders?.domain;
      if (resolved) {
        patch.domain = resolved;
        setDomain(resolved);
      }
      updateSession(patch);
    } catch (err) {
      setError(errorMessage(err, t('serverFailed')));
    } finally {
      setRunning(false);
    }
  }

  const field = 'w-full bg-surface border border-line rounded-lg px-3 py-2.5 text-sm text-ink placeholder-faint focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20';

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="no-print">
        <PageHeader
          icon={<FileText className="w-5 h-5" />}
          title={t('reportTitle')}
          description={t('reportDesc')}
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('clientName')}
              <input className={field} value={clientName} onChange={(e) => { setClientName(e.target.value); updateSession({ clientName: e.target.value }); }} placeholder="Example Shop Ltd" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('domain')}
              <input className={field} value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="company.co.il" spellCheck={false} />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('consultantName')}
              <input className={field} value={profile.name} onChange={(e) => updateProfile({ name: e.target.value })} placeholder="Samuel" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('phone')}
              <input dir="ltr" className={field} value={profile.phone} onChange={(e) => updateProfile({ phone: e.target.value })} placeholder="050-000-0000" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('email')}
              <input dir="ltr" type="email" className={field} value={profile.email} onChange={(e) => updateProfile({ email: e.target.value })} placeholder="samuel@example.com" />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('website')}
              <input dir="ltr" className={field} value={profile.website} onChange={(e) => updateProfile({ website: e.target.value })} placeholder="example.com" />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {missing && (
              <button
                onClick={runChecks}
                disabled={running}
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-strong disabled:bg-brand/50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {domainAudit || httpHeaders ? t('runMissing') : t('runBoth')}
              </button>
            )}
            <button
              onClick={() => window.print()}
              disabled={!report}
              className={`inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
                missing ? 'border border-line-strong bg-surface text-ink hover:border-brand' : 'bg-brand hover:bg-brand-strong text-white'
              }`}
            >
              <Printer className="w-4 h-4" />
              {t('printPdf')}
            </button>
          </div>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <p className="text-xs text-muted">
            {domainAudit ? `✓ ${t('emailIncluded')}` : `– ${t('emailNotRun')}`} · {httpHeaders ? `✓ ${t('webIncluded')}` : `– ${t('webNotRun')}`}.
            {t('savePdfHint')}
          </p>
        </div>
      </div>

      {report ? (
        <div className="px-4 sm:px-8 pb-12">
          <ReportDocument report={report} profile={profile} />
        </div>
      ) : (
        <p className="no-print max-w-2xl mx-auto px-4 sm:px-8 text-sm text-muted">
          {t('reportEmpty')}
        </p>
      )}
    </div>
  );
}

function Problem({ r }: { r: ReportFinding }) {
  return (
    <tr className="align-top border-t border-line break-inside-avoid">
      <td className="py-2.5 pe-3">
        <span className={`inline-block rounded border px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${SEVERITY_STYLE[r.finding.severity].cls}`}>
          {SEVERITY_HE[r.finding.severity]}
        </span>
      </td>
      <td className="py-2.5 pe-3">
        <p className="font-semibold text-ink"><He text={r.he.title} /></p>
        <p className="text-ink-2 mt-0.5"><He text={r.he.impact} /></p>
      </td>
      <td className="py-2.5 text-ink-2 whitespace-nowrap">{EFFORT_HE[r.he.effort].split(' — ')[0]}</td>
    </tr>
  );
}

function ReportDocument({ report, profile }: { report: Report; profile: ConsultantProfile }) {
  const { input, overall, sections, problems, good, topRisks, thisWeek } = report;
  const client = input.clientName.trim() || input.domain;

  return (
    <article
      dir="rtl"
      lang="he"
      className="print-area mx-auto max-w-[210mm] bg-surface border border-line rounded-xl shadow-sm print:shadow-none print:border-0 print:rounded-none px-8 sm:px-12 py-10 text-[13.5px] leading-relaxed text-ink"
    >
      {/* Professional cover page */}
      <section className="min-h-[240mm] flex flex-col justify-between print:break-after-page">
        <div>
          <div className="flex items-center justify-between gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand text-white flex items-center justify-center text-2xl font-bold" aria-hidden="true">
              {(profile.name.trim() || 'S').slice(0, 1).toUpperCase()}
            </div>
            <p className="text-sm text-muted">{formatDateHe(input.date)}</p>
          </div>

          <div className="mt-20">
            <p className="text-sm font-semibold text-brand">דוח בדיקת אבטחת מידע</p>
            <h1 className="text-4xl font-bold tracking-tight mt-3">{client}</h1>
            <p className="text-xl text-ink-2 mt-2" dir="ltr" style={{ textAlign: 'right' }}>{input.domain}</p>
            <div className="mt-8 h-1 w-24 bg-brand rounded-full" />
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <p className="text-xs text-muted mb-2">הוכן על ידי</p>
          <p className="text-2xl font-bold text-ink">{profile.name.trim() || 'Samuel'}</p>
          <div className="mt-3 space-y-1 text-sm text-ink-2" dir="ltr" style={{ textAlign: 'right' }}>
            {profile.phone && <p>{profile.phone}</p>}
            {profile.email && <p>{profile.email}</p>}
            {profile.website && <p>{profile.website}</p>}
          </div>
          <p className="mt-8 text-xs text-muted">
            בדיקה חיצונית המבוססת על מידע ציבורי בלבד. אין בדוח זה התחייבות לעמידה בתקן או בדרישה רגולטורית.
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="py-6 border-b border-line break-inside-avoid">
        <div className="flex items-center gap-6">
          <GradeBadge grade={overall.grade} />
          <div>
            <p className="text-sm text-muted">ציון כולל</p>
            <p className="text-3xl font-bold">{overall.score} / 100</p>
            <p className="text-ink-2">
              {problems.length === 0 ? 'לא נמצאו בעיות.' : `נמצאו ${problems.length} נקודות לשיפור, מתוכן ${problems.filter((p) => ['critical', 'high'].includes(p.finding.severity)).length} בחומרה גבוהה.`}
            </p>
          </div>
          <div className="ms-auto flex gap-6">
            {sections.map((s) => (
              <div key={s.key} className="text-center">
                <GradeBadge grade={s.score.grade} size="sm" />
                <p className="text-xs text-muted mt-1.5 max-w-[7rem]">{SECTION_HE[s.key]}</p>
              </div>
            ))}
          </div>
        </div>

        {topRisks.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-2">שלושת הסיכונים העיקריים</h2>
            <ol className="list-decimal ps-5 space-y-1.5">
              {topRisks.map((r) => (
                <li key={r.finding.id}>
                  <span className="font-semibold"><He text={r.he.title} />.</span> <He text={r.he.impact} />
                </li>
              ))}
            </ol>
          </div>
        )}

        {thisWeek.length > 0 && (
          <div className="mt-5 rounded-lg bg-brand-soft px-5 py-4">
            <h2 className="text-base font-bold mb-1.5">מה לעשות השבוע</h2>
            <ul className="list-disc ps-5 space-y-1">
              {thisWeek.map((r) => (
                <li key={r.finding.id}><He text={r.he.fix} /></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Findings table */}
      {problems.length > 0 && (
        <section className="py-6 border-b border-line">
          <h2 className="text-lg font-bold mb-3">הממצאים</h2>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="text-right text-muted text-xs">
                <th className="pb-2 pe-3 font-medium w-16">חומרה</th>
                <th className="pb-2 pe-3 font-medium">ממצא והשפעה על העסק</th>
                <th className="pb-2 font-medium w-20">מאמץ</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((r) => <Problem key={r.finding.id} r={r} />)}
            </tbody>
          </table>
        </section>
      )}

      {/* Action plan */}
      {problems.length > 0 && (
        <section className="py-6 border-b border-line">
          <h2 className="text-lg font-bold mb-1">תוכנית תיקון לפי סדר עדיפות</h2>
          <p className="text-ink-2 mb-4">קודם החמור והקל לתיקון, אחר כך השאר. אפשר להעביר כל שורה לגורם המתאים.</p>
          <ol className="space-y-3">
            {problems.map((r, i) => (
              <li key={r.finding.id} className="flex gap-3 break-inside-avoid">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sunken text-ink-2 text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                <div>
                  <p className="font-semibold"><He text={r.he.title} /></p>
                  <p className="text-ink-2"><He text={r.he.fix} /></p>
                  <p className="text-xs text-muted mt-0.5">
                    באחריות: <bdi>{OWNER_HE[r.he.owner]}</bdi> · <bdi>{EFFORT_HE[r.he.effort]}</bdi>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* What is fine */}
      {good.length > 0 && (
        <section className="py-6 border-b border-line break-inside-avoid">
          <h2 className="text-lg font-bold mb-2">מה כבר תקין</h2>
          <ul className="space-y-1">
            {good.map((r) => (
              <li key={r.finding.id} className="flex gap-2">
                <span className="text-emerald-700 font-bold" aria-hidden="true">✓</span>
                <span><He text={r.he.title} /></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Technical appendix */}
      <section className="pt-6">
        <h2 className="text-lg font-bold mb-1">נספח טכני</h2>
        <p className="text-ink-2 mb-3">הנתונים הגולמיים, לשימוש הספק הטכני.</p>
        <div dir="ltr" className="text-left font-mono text-[11px] leading-snug text-ink-2 space-y-3">
          {input.domainAudit && (
            <div className="break-inside-avoid">
              <p className="font-sans font-semibold text-ink text-xs mb-1">DNS — {input.domainAudit.domain}</p>
              <p>MX: {input.domainAudit.mx.join(' | ') || '—'}</p>
              <p className="break-all">SPF: {input.domainAudit.spf.records.join(' | ') || '—'}{input.domainAudit.spf.lookups !== null ? ` (${input.domainAudit.spf.lookups} lookups)` : ''}</p>
              <p className="break-all">DMARC: {input.domainAudit.dmarc.records.join(' | ') || '—'}</p>
              <p>DKIM: {input.domainAudit.dkim.found.map((k) => k.selector).join(', ') || `none found (checked ${input.domainAudit.dkim.checked.join(', ')})`}</p>
              <p>DNSSEC: {input.domainAudit.dnssec ? 'yes' : 'no'} · MTA-STS: {input.domainAudit.mtaSts ? 'yes' : 'no'} · TLS-RPT: {input.domainAudit.tlsRpt ? 'yes' : 'no'}</p>
            </div>
          )}
          {input.httpHeaders && (
            <div className="break-inside-avoid">
              <p className="font-sans font-semibold text-ink text-xs mb-1">HTTP — {input.httpHeaders.https.finalUrl ?? input.httpHeaders.domain}</p>
              {input.httpHeaders.https.chain.map((h) => <p key={h.url} className="break-all">{h.status} {h.url}</p>)}
              {input.httpHeaders.https.error && <p>HTTPS: {input.httpHeaders.https.error}</p>}
              {Object.entries(input.httpHeaders.https.headers).map(([k, v]) => <p key={k} className="break-all">{k}: {v}</p>)}
              {Object.keys(input.httpHeaders.https.headers).length === 0 && <p>No security headers received.</p>}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-line text-xs text-muted">
        הבדיקה נערכה מבחוץ, על סמך מידע ציבורי בלבד (DNS וכותרות האתר), בתאריך {formatDateHe(input.date)}. היא משקפת את המצב במועד הבדיקה ואינה מהווה אישור עמידה בדרישות חוק או תקן.
      </footer>
    </article>
  );
}
