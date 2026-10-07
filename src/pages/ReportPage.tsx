import { useMemo, useState } from 'react';
import { FileText, Printer, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { GradeBadge } from '../components/AuditResult';
import { apiPost, apiErrorOf, errorMessage } from '../utils/apiClient';
import { updateSession, useAuditSession } from '../utils/auditSession';
import type { DomainAuditData } from '../utils/domainScore';
import { isHttpHeadersInconclusive, type HttpHeadersData } from '../utils/httpHeadersScore';
import { hasAssessedInternalControls, internalScoreCaps, isInternalAuditComplete, type EvidenceStatus } from '../utils/internalAudit';
import { emailPlatformLabelHe, hasClientEnvironment, presenceLabelHe } from '../utils/clientEnvironment';
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

const SECTION_HE = { email: 'אבטחת הדואר האלקטרוני', web: 'אבטחת האתר', internal: 'בקרות אבטחה פנימיות' } as const;

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
  const internalAudit = session.internalAudit;
  const clientEnvironment = session.clientEnvironment;
  const missing = !domainAudit || !httpHeaders;
  const webInconclusive = httpHeaders ? isHttpHeadersInconclusive(httpHeaders) : false;

  const report = useMemo(
    () => buildReport({ clientName, auditor: profile.name, domain, date: new Date(), domainAudit, httpHeaders, internalAudit, clientEnvironment }),
    [clientName, profile.name, domain, domainAudit, httpHeaders, internalAudit, clientEnvironment],
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
            {domainAudit ? `✓ ${t('emailIncluded')}` : `– ${t('emailNotRun')}`} · {httpHeaders ? (webInconclusive ? `– ${t('webInconclusive')}` : `✓ ${t('webIncluded')}`) : `– ${t('webNotRun')}`}.
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

function evidenceLabelHe(value: EvidenceStatus | undefined): string {
  if (value === 'verified') return 'אומת על ידי היועץ';
  if (value === 'client') return 'הוצהר על ידי הלקוח';
  return 'לא אומת';
}

function Problem({ r, evidence }: { r: ReportFinding; evidence?: EvidenceStatus }) {
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
        {r.section === 'internal' && (
          <p className="text-xs text-muted mt-1.5">מקור: {evidenceLabelHe(evidence)}</p>
        )}
        {r.section === 'internal' && r.finding.detail && (
          <p className="text-xs text-muted mt-1">תצפית: <bdi>{r.finding.detail}</bdi></p>
        )}
      </td>
      <td className="py-2.5 text-ink-2 whitespace-nowrap">{EFFORT_HE[r.he.effort].split(' — ')[0]}</td>
    </tr>
  );
}

function ReportDocument({ report, profile }: { report: Report; profile: ConsultantProfile }) {
  const { input, overall, webInconclusive, sections, problems, good, topRisks, thisWeek } = report;
  const client = input.clientName.trim() || input.domain;
  const internalCaps = input.internalAudit ? internalScoreCaps(input.internalAudit) : [];

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
            הדוח משלב בדיקות חיצוניות המבוססות על מידע ציבורי עם תשובות ותצפיות שנאספו במהלך הבדיקה. אין בדוח זה התחייבות לעמידה בתקן או בדרישה רגולטורית.
          </p>
        </div>
      </section>

      {/* Summary */}
      <section className="py-6 border-b border-line break-inside-avoid">
        <div className="flex items-center gap-6">
          {overall ? (
            <GradeBadge grade={overall.grade} />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-[3px] border-amber-300 bg-amber-50 text-xl font-bold text-amber-800">N/A</div>
          )}
          <div>
            <p className="text-sm text-muted">ציון כולל</p>
            <p className="text-3xl font-bold">{overall ? `${overall.score} / 100` : 'לא רלוונטי'}</p>
            <p className="text-ink-2">
              {problems.length === 0 ? 'לא נמצאו בעיות שניתן לדרג.' : `נמצאו ${problems.length} נקודות לשיפור, מתוכן ${problems.filter((p) => ['critical', 'high'].includes(p.finding.severity)).length} בחומרה גבוהה.`}
            </p>
          </div>
          <div className="ms-auto flex gap-6">
            {sections.map((s) => (
              <div key={s.key} className="text-center">
                {s.includedInOverall ? (
                  <GradeBadge grade={s.score.grade} size="sm" />
                ) : (
                  <div className="flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-slate-300 bg-slate-50 px-2 text-[11px] font-bold text-slate-700">
                    בתהליך
                  </div>
                )}
                <p className="text-xs text-muted mt-1.5 max-w-[7rem]">{SECTION_HE[s.key]}</p>
              </div>
            ))}
            {webInconclusive && (
              <div className="text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-50 text-sm font-bold text-amber-800">N/A</div>
                <p className="text-xs text-muted mt-1.5 max-w-[7rem]">{SECTION_HE.web}</p>
              </div>
            )}
          </div>
        </div>
        {sections.some((s) => s.key === 'internal' && !s.includedInOverall) && (
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-slate-800">
            <p className="font-semibold">שאלון האבטחה הפנימי עדיין בתהליך</p>
            <p className="mt-1 text-sm">הממצאים שכבר נבדקו מופיעים בדוח, אך הציון הפנימי אינו נכלל בציון הכולל עד שכל הבקרות נבדקו או סומנו כלא רלוונטיות.</p>
          </div>
        )}
        {internalCaps.length > 0 && isInternalAuditComplete(input.internalAudit) && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
            <p className="font-semibold">הציון הפנימי הוגבל בגלל בקרה קריטית חסרה</p>
            <ul className="mt-1 list-disc ps-5 text-sm space-y-1">
              {internalCaps.map((cap) => (
                <li key={cap.controlId}>{cap.reasonHe} ציון פנימי מרבי: {cap.maxScore}/100.</li>
              ))}
            </ul>
          </div>
        )}
        {webInconclusive && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
            <p className="font-semibold">בדיקת האתר לא הושלמה</p>
            <p className="mt-1 text-sm">לא התקבלה תגובה ב-HTTP או ב-HTTPS. ייתכן שאין אתר ציבורי לדומיין, ולכן בדיקת HTTPS וכותרות האבטחה לא נכללת בציון.</p>
          </div>
        )}

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

      {hasClientEnvironment(input.clientEnvironment ?? null) && (
        <section className="py-6 border-b border-line break-inside-avoid">
          <h2 className="text-lg font-bold mb-3">סביבת הלקוח</h2>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
            {input.clientEnvironment?.users && (
              <p><span className="text-muted">משתמשים:</span> <bdi>{input.clientEnvironment.users}</bdi></p>
            )}
            {input.clientEnvironment?.endpoints && (
              <p><span className="text-muted">מחשבים / תחנות:</span> <bdi>{input.clientEnvironment.endpoints}</bdi></p>
            )}
            {input.clientEnvironment?.emailPlatform && (
              <p><span className="text-muted">מערכת דואר:</span> <bdi>{emailPlatformLabelHe(input.clientEnvironment.emailPlatform)}</bdi></p>
            )}
            {input.clientEnvironment?.servers && (
              <p><span className="text-muted">שרתים:</span> <bdi>{presenceLabelHe(input.clientEnvironment.servers)}</bdi></p>
            )}
            {input.clientEnvironment?.endpointProtection && (
              <p><span className="text-muted">Endpoint / EDR:</span> <bdi>{input.clientEnvironment.endpointProtection}</bdi></p>
            )}
            {input.clientEnvironment?.backupSolution && (
              <p><span className="text-muted">גיבוי:</span> <bdi>{input.clientEnvironment.backupSolution}</bdi></p>
            )}
            {input.clientEnvironment?.remoteAccess && (
              <p className="sm:col-span-2"><span className="text-muted">גישה מרחוק:</span> <bdi>{input.clientEnvironment.remoteAccess}</bdi></p>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">מידע זה מתאר את סביבת הלקוח בלבד ואינו משפיע על הציון.</p>
        </section>
      )}

      {/* Audit scope */}
      <section className="py-6 border-b border-line break-inside-avoid">
        <h2 className="text-lg font-bold mb-3">היקף הבדיקה</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-sunken px-4 py-3">
            <p className="text-xs text-muted">אבטחת דואר</p>
            <p className="font-semibold mt-1">{input.domainAudit ? 'הושלם ונכלל בציון' : 'לא בוצע'}</p>
          </div>
          <div className="rounded-lg border border-line bg-sunken px-4 py-3">
            <p className="text-xs text-muted">אבטחת אתר</p>
            <p className="font-semibold mt-1">
              {!input.httpHeaders ? 'לא בוצע' : webInconclusive ? 'לא ניתן להשלים — לא נכלל בציון' : 'הושלם ונכלל בציון'}
            </p>
          </div>
          <div className="rounded-lg border border-line bg-sunken px-4 py-3">
            <p className="text-xs text-muted">בקרות פנימיות</p>
            <p className="font-semibold mt-1">
              {!hasAssessedInternalControls(input.internalAudit)
                ? 'לא בוצע'
                : isInternalAuditComplete(input.internalAudit)
                  ? 'הושלם ונכלל בציון'
                  : 'בתהליך — הממצאים מוצגים אך הציון לא נכלל'}
            </p>
          </div>
        </div>
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
              {problems.map((r) => <Problem key={r.finding.id} r={r} evidence={r.section === 'internal' ? input.internalAudit?.evidence?.[r.finding.id.replace(/^internal-/, '').replace(/-(ok|yes|partial|no)$/, '') as keyof NonNullable<typeof input.internalAudit>['evidence']] : undefined} />)}
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
          {hasClientEnvironment(input.clientEnvironment ?? null) && (
            <div className="break-inside-avoid">
              <p className="font-sans font-semibold text-ink text-xs mb-1">Client environment</p>
              {input.clientEnvironment?.users && <p>Users: {input.clientEnvironment.users}</p>}
              {input.clientEnvironment?.endpoints && <p>Endpoints: {input.clientEnvironment.endpoints}</p>}
              {input.clientEnvironment?.emailPlatform && <p>Email platform: {input.clientEnvironment.emailPlatform}</p>}
              {input.clientEnvironment?.servers && <p>Servers: {input.clientEnvironment.servers}</p>}
              {input.clientEnvironment?.endpointProtection && <p>Endpoint protection: {input.clientEnvironment.endpointProtection}</p>}
              {input.clientEnvironment?.backupSolution && <p>Backup: {input.clientEnvironment.backupSolution}</p>}
              {input.clientEnvironment?.remoteAccess && <p>Remote access: {input.clientEnvironment.remoteAccess}</p>}
            </div>
          )}
          {input.internalAudit && (
            <div className="break-inside-avoid">
              <p className="font-sans font-semibold text-ink text-xs mb-1">Internal controls</p>
              {Object.entries(input.internalAudit.answers).map(([key, value]) => {
                const observation = input.internalAudit?.observations?.[key as keyof typeof input.internalAudit.observations] ?? '';
                return (
                  <div key={key}>
                    <p>{key}: {value}</p>
                    <p>  evidence: {input.internalAudit?.evidence?.[key as keyof typeof input.internalAudit.evidence] ?? 'unverified'}</p>
                    {observation && <p className="whitespace-pre-wrap">  observation: {observation}</p>}
                  </div>
                );
              })}
              {input.internalAudit.notes && <p className="whitespace-pre-wrap">Notes: {input.internalAudit.notes}</p>}
            </div>
          )}
          {input.httpHeaders && (
            <div className="break-inside-avoid">
              <p className="font-sans font-semibold text-ink text-xs mb-1">HTTP — {input.httpHeaders.https.finalUrl ?? input.httpHeaders.domain}</p>
              {input.httpHeaders.https.chain.map((h) => <p key={h.url} className="break-all">{h.status} {h.url}</p>)}
              {input.httpHeaders.https.error && <p>HTTPS: {input.httpHeaders.https.error}</p>}
              {Object.entries(input.httpHeaders.https.headers).map(([k, v]) => <p key={k} className="break-all">{k}: {v}</p>)}
              {Object.keys(input.httpHeaders.https.headers).length === 0 && <p>{isHttpHeadersInconclusive(input.httpHeaders) ? 'Security headers: not evaluated.' : 'No security headers detected.'}</p>}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-line text-xs text-muted">
        הבדיקה נערכה בתאריך {formatDateHe(input.date)} ומשלבת מידע ציבורי (DNS וכותרות האתר) עם תשובות ותצפיות שנאספו מהלקוח. היא משקפת את המצב במועד הבדיקה ואינה מהווה אישור עמידה בדרישות חוק או תקן.
      </footer>
    </article>
  );
}
