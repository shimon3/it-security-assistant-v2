// Builds the client report from the checks run in this session. Pure functions, no UI.

import { gradeFor, SEVERITY_ORDER, type Finding, type Grade, type Score } from './findings';
import { scoreDomain, type DomainAuditData } from './domainScore';
import { isHttpHeadersInconclusive, scoreHttpHeaders, type HttpHeadersData } from './httpHeadersScore';
import { heText, type HeText } from './reportHe';
import { hasAssessedInternalControls, isInternalAuditComplete, scoreInternalAudit, type InternalAuditData } from './internalAudit';
import type { ClientEnvironment } from './clientEnvironment';

export interface ReportInput {
  clientName: string;
  auditor: string;
  domain: string;
  date: Date;
  domainAudit: DomainAuditData | null;
  httpHeaders: HttpHeadersData | null;
  internalAudit: InternalAuditData | null;
  clientEnvironment: ClientEnvironment | null;
}

export interface ReportFinding {
  finding: Finding;
  he: HeText;
  section: 'email' | 'web' | 'internal';
}

export interface ReportSection {
  key: 'email' | 'web' | 'internal';
  score: Score;
  includedInOverall: boolean;
}

export interface Report {
  input: ReportInput;
  overall: { score: number; grade: Grade } | null;
  webInconclusive: boolean;
  sections: ReportSection[];
  /** Problems only, most severe first, then easiest first. */
  problems: ReportFinding[];
  /** What is already right. */
  good: ReportFinding[];
  /** Up to 3 most severe problems, for the summary. */
  topRisks: ReportFinding[];
  /** Easy fixes with at least medium severity: "do this week". */
  thisWeek: ReportFinding[];
}

const EFFORT_ORDER = ['easy', 'medium', 'hard'];

function byPriority(a: ReportFinding, b: ReportFinding): number {
  const s = SEVERITY_ORDER.indexOf(a.finding.severity) - SEVERITY_ORDER.indexOf(b.finding.severity);
  return s !== 0 ? s : EFFORT_ORDER.indexOf(a.he.effort) - EFFORT_ORDER.indexOf(b.he.effort);
}

export function buildReport(input: ReportInput): Report | null {
  const sections: ReportSection[] = [];
  const webInconclusive = !!input.httpHeaders && isHttpHeadersInconclusive(input.httpHeaders);
  if (input.domainAudit) sections.push({ key: 'email', score: scoreDomain(input.domainAudit), includedInOverall: true });
  if (input.httpHeaders && !webInconclusive) sections.push({ key: 'web', score: scoreHttpHeaders(input.httpHeaders), includedInOverall: true });
  if (input.internalAudit && hasAssessedInternalControls(input.internalAudit)) {
    sections.push({
      key: 'internal',
      score: scoreInternalAudit(input.internalAudit),
      includedInOverall: isInternalAuditComplete(input.internalAudit),
    });
  }
  if (!input.domainAudit && !input.httpHeaders && !hasAssessedInternalControls(input.internalAudit)) return null;

  const all: ReportFinding[] = sections.flatMap((s) => s.score.findings.map((finding) => ({ finding, he: heText(finding), section: s.key })));
  const problems = all.filter((r) => r.finding.severity !== 'ok').sort(byPriority);
  const good = all.filter((r) => r.finding.severity === 'ok');

  const scoredSections = sections.filter((s) => s.includedInOverall);
  const score = scoredSections.length > 0
    ? Math.round(scoredSections.reduce((sum, s) => sum + s.score.score, 0) / scoredSections.length)
    : null;

  return {
    input,
    overall: score === null ? null : { score, grade: gradeFor(score) },
    webInconclusive,
    sections,
    problems,
    good,
    topRisks: problems.slice(0, 3),
    thisWeek: problems
      .filter((r) => r.he.effort === 'easy' && ['critical', 'high', 'medium'].includes(r.finding.severity))
      .slice(0, 5),
  };
}

export function formatDateHe(d: Date): string {
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}
