// Turns the raw DNS data from /api/domain-audit into findings and an A–E grade.
// Each finding carries a plain-language impact for a non-technical client, and a technical detail.

export interface DomainAuditData {
  domain: string;
  exists: boolean;
  dnssec: boolean;
  mx: string[];
  spf: { records: string[]; lookups: number | null };
  dmarc: { records: string[] };
  dkim: { found: { selector: string; record: string }[]; checked: string[] };
  mtaSts: string | null;
  tlsRpt: string | null;
  checkedAt: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'ok';

export interface Finding {
  id: string;
  control: 'SPF' | 'DMARC' | 'DKIM' | 'MX' | 'DNSSEC' | 'MTA-STS' | 'TLS-RPT';
  severity: Severity;
  title: string;
  /** What it means for the business, in plain words. */
  impact: string;
  recommendation: string;
  /** Raw record or technical detail, for the appendix. */
  detail?: string;
  /** Points removed from 100. */
  penalty: number;
}

export interface DomainScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  findings: Finding[];
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'ok'];

/** Parses "v=DMARC1; p=reject; rua=mailto:x" into lower-case tag names. */
export function parseTags(record: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of record.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return tags;
}

/** The SPF "all" qualifier: '+', '-', '~', '?' or null when the record has no "all". */
export function spfAllQualifier(record: string): string | null {
  const term = record.split(/\s+/).find((t) => /^[+\-~?]?all$/i.test(t));
  if (!term) return null;
  return /^[+\-~?]/.test(term) ? term[0] : '+';
}

export function gradeFor(score: number): DomainScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

function spfFindings(d: DomainAuditData): Finding[] {
  const { records, lookups } = d.spf;
  if (records.length === 0) {
    return [{
      id: 'spf-missing', control: 'SPF', severity: 'critical', penalty: 25,
      title: 'No SPF record',
      impact: 'Mail servers cannot check which servers may send email for this domain, so forged emails are easier to deliver.',
      recommendation: 'Publish one TXT record starting with "v=spf1" that lists your email providers and ends with "-all" or "~all".',
    }];
  }
  if (records.length > 1) {
    return [{
      id: 'spf-multiple', control: 'SPF', severity: 'high', penalty: 20,
      title: `${records.length} SPF records instead of one`,
      impact: 'With more than one SPF record, receiving servers treat SPF as broken, as if there were none.',
      recommendation: 'Merge them into a single "v=spf1" record.',
      detail: records.join('\n'),
    }];
  }

  const record = records[0];
  const out: Finding[] = [];
  const all = spfAllQualifier(record);

  if (all === '+') {
    out.push({
      id: 'spf-pass-all', control: 'SPF', severity: 'critical', penalty: 30,
      title: 'SPF allows every server in the world ("+all")',
      impact: 'Anyone can send email that passes SPF in your name.',
      recommendation: 'Replace "+all" with "-all" (or "~all" while you check that all your senders are listed).',
      detail: record,
    });
  } else if (all === '?' || all === null) {
    out.push({
      id: 'spf-neutral', control: 'SPF', severity: 'medium', penalty: 15,
      title: all === null ? 'SPF record has no "all" rule' : 'SPF ends with "?all" (neutral)',
      impact: 'Servers not listed in SPF are not marked as suspicious, so SPF gives almost no protection.',
      recommendation: 'End the record with "-all" or "~all".',
      detail: record,
    });
  } else if (all === '~') {
    out.push({
      id: 'spf-softfail', control: 'SPF', severity: 'low', penalty: 5,
      title: 'SPF ends with "~all" (soft fail)',
      impact: 'Acceptable when DMARC is enforced; on its own, forged emails may still be delivered to spam rather than blocked.',
      recommendation: 'Move to "-all" once every legitimate sender is listed, or rely on an enforced DMARC policy.',
      detail: record,
    });
  }

  if (lookups !== null && lookups > 10) {
    out.push({
      id: 'spf-too-many-lookups', control: 'SPF', severity: 'high', penalty: 15,
      title: `SPF needs ${lookups} DNS lookups (limit is 10)`,
      impact: 'Above 10 lookups, receiving servers treat SPF as failed, so even your genuine emails can be rejected or sent to spam.',
      recommendation: 'Remove unused "include:" entries or replace some of them with the providers\' IP ranges.',
      detail: record,
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'spf-ok', control: 'SPF', severity: 'ok', penalty: 0,
      title: 'SPF is strict ("-all")', impact: 'Only the listed servers may send for this domain.', recommendation: '—', detail: record,
    });
  }
  return out;
}

function dmarcFindings(d: DomainAuditData): Finding[] {
  const { records } = d.dmarc;
  if (records.length === 0) {
    return [{
      id: 'dmarc-missing', control: 'DMARC', severity: 'critical', penalty: 30,
      title: 'No DMARC record',
      impact: 'Anyone can send emails that look like they come from this domain, to clients, suppliers or staff, and receiving servers have no instruction to block them.',
      recommendation: 'Publish "_dmarc" TXT: start with "v=DMARC1; p=none; rua=mailto:…" to collect reports, then move to "p=quarantine" and "p=reject".',
    }];
  }
  if (records.length > 1) {
    return [{
      id: 'dmarc-multiple', control: 'DMARC', severity: 'high', penalty: 25,
      title: `${records.length} DMARC records instead of one`,
      impact: 'With more than one record, receiving servers ignore DMARC entirely.',
      recommendation: 'Keep a single "_dmarc" TXT record.',
      detail: records.join('\n'),
    }];
  }

  const record = records[0];
  const tags = parseTags(record);
  const policy = (tags.p ?? '').toLowerCase();
  const out: Finding[] = [];

  if (policy === 'reject') {
    out.push({
      id: 'dmarc-reject', control: 'DMARC', severity: 'ok', penalty: 0,
      title: 'DMARC blocks forged emails (p=reject)', impact: 'Receiving servers reject emails that fail authentication.', recommendation: '—', detail: record,
    });
  } else if (policy === 'quarantine') {
    out.push({
      id: 'dmarc-quarantine', control: 'DMARC', severity: 'low', penalty: 5,
      title: 'DMARC sends forged emails to spam (p=quarantine)',
      impact: 'Forged emails usually land in spam instead of being blocked.',
      recommendation: 'Move to "p=reject" once reports show only legitimate senders passing.',
      detail: record,
    });
  } else {
    out.push({
      id: 'dmarc-none', control: 'DMARC', severity: 'high', penalty: 15,
      title: policy === 'none' ? 'DMARC only monitors (p=none)' : 'DMARC policy is missing or invalid',
      impact: 'Forged emails in your name are still delivered normally; the record only produces reports.',
      recommendation: 'Review the reports, then move to "p=quarantine" and then "p=reject".',
      detail: record,
    });
  }

  const pct = tags.pct !== undefined ? Number(tags.pct) : 100;
  if (policy !== 'none' && pct < 100) {
    out.push({
      id: 'dmarc-pct', control: 'DMARC', severity: 'low', penalty: 5,
      title: `DMARC applies to only ${pct}% of emails`,
      impact: 'The remaining emails that fail authentication are delivered normally.',
      recommendation: 'Raise "pct" to 100 (or remove it).',
      detail: record,
    });
  }
  if (!tags.rua) {
    out.push({
      id: 'dmarc-no-reports', control: 'DMARC', severity: 'low', penalty: 3,
      title: 'DMARC reports are not collected (no "rua")',
      impact: 'Nobody sees who is sending emails in your name, legitimate or not.',
      recommendation: 'Add "rua=mailto:…" with a mailbox or a free DMARC report service.',
      detail: record,
    });
  }
  return out;
}

function dkimFindings(d: DomainAuditData): Finding[] {
  if (d.dkim.found.length > 0) {
    return [{
      id: 'dkim-found', control: 'DKIM', severity: 'ok', penalty: 0,
      title: `DKIM key found (selector "${d.dkim.found.map((f) => f.selector).join('", "')}")`,
      impact: 'Emails can be signed so receivers can verify they were not altered.', recommendation: '—',
    }];
  }
  return [{
    id: 'dkim-not-found', control: 'DKIM', severity: 'medium', penalty: 10,
    title: 'No DKIM key found on the usual selectors',
    impact: 'Emails may not be signed, which weakens DMARC. The provider may use a selector not checked here: confirm in the email admin console.',
    recommendation: 'Enable DKIM signing in Google Workspace, Microsoft 365 or the hosting panel, and publish the key it gives.',
    detail: `Selectors checked: ${d.dkim.checked.join(', ')}`,
  }];
}

export function scoreDomain(d: DomainAuditData): DomainScore {
  const findings: Finding[] = [];

  if (d.mx.length === 0) {
    findings.push({
      id: 'mx-missing', control: 'MX', severity: 'low', penalty: 0,
      title: 'Domain does not receive email (no MX record)',
      impact: 'If the domain never sends email either, it should say so in DNS, otherwise it is an easy target for forgery.',
      recommendation: 'For a domain that sends no email: SPF "v=spf1 -all" and DMARC "p=reject".',
    });
  }

  findings.push(...spfFindings(d), ...dmarcFindings(d), ...dkimFindings(d));

  findings.push(
    d.dnssec
      ? { id: 'dnssec-on', control: 'DNSSEC', severity: 'ok', penalty: 0, title: 'DNSSEC is enabled', impact: 'DNS answers for this domain are signed.', recommendation: '—' }
      : {
          id: 'dnssec-off', control: 'DNSSEC', severity: 'low', penalty: 5,
          title: 'DNSSEC is not enabled',
          impact: 'DNS answers are not signed, so they could be forged in transit. Rare in practice, but cheap to fix.',
          recommendation: 'Enable DNSSEC at the DNS provider and the registrar.',
        },
  );

  if (d.mx.length > 0) {
    if (!d.mtaSts) {
      findings.push({
        id: 'mta-sts-missing', control: 'MTA-STS', severity: 'low', penalty: 3,
        title: 'MTA-STS is not configured',
        impact: 'Incoming email can be downgraded to an unencrypted connection by an attacker on the network.',
        recommendation: 'Publish an MTA-STS policy (Google Workspace and Microsoft 365 both support it).',
      });
    }
    if (!d.tlsRpt) {
      findings.push({
        id: 'tls-rpt-missing', control: 'TLS-RPT', severity: 'low', penalty: 2,
        title: 'TLS reporting is not configured',
        impact: 'Failures to deliver email securely to you go unnoticed.',
        recommendation: 'Publish "_smtp._tls" TXT "v=TLSRPTv1; rua=mailto:…".',
      });
    }
  }

  const score = Math.max(0, 100 - findings.reduce((sum, f) => sum + f.penalty, 0));
  findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  return { score, grade: gradeFor(score), findings };
}
