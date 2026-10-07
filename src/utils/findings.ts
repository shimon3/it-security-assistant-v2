// Shared vocabulary for every audit check: a finding, its severity, and the A–E grade.

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'ok';

export interface Finding {
  /** Stable id, also the key for translations (src/utils/reportHe.ts). */
  id: string;
  /** Short name of what was checked, e.g. "DMARC" or "HSTS". */
  control: string;
  severity: Severity;
  title: string;
  /** What it means for the business, in plain words. */
  impact: string;
  recommendation: string;
  /** Raw record or technical detail, for the appendix. */
  detail?: string;
  /** Values used in the title (counts, percentages…), for translations. */
  params?: Record<string, string | number>;
  /** Points removed from 100. */
  penalty: number;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Score {
  score: number;
  grade: Grade;
  findings: Finding[];
}

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'ok'];

export function gradeFor(score: number): Grade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'E';
}

/** Totals penalties into a 0–100 score and sorts findings from most to least severe. */
export function toScore(findings: Finding[]): Score {
  const score = Math.max(0, 100 - findings.reduce((sum, f) => sum + f.penalty, 0));
  const sorted = [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
  return { score, grade: gradeFor(score), findings: sorted };
}

export function countSerious(findings: Finding[]): number {
  return findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length;
}
