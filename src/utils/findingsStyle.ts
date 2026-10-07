import type { Grade, Score, Severity } from './findings';

export const GRADE_STYLE: Record<Grade, string> = {
  A: 'text-emerald-700 border-emerald-500 bg-emerald-50',
  B: 'text-lime-700 border-lime-500 bg-lime-50',
  C: 'text-amber-700 border-amber-500 bg-amber-50',
  D: 'text-orange-700 border-orange-500 bg-orange-50',
  E: 'text-red-700 border-red-500 bg-red-50',
};

export const SEVERITY_STYLE: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'text-red-700 bg-red-50 border-red-300' },
  high: { label: 'High', cls: 'text-orange-700 bg-orange-50 border-orange-300' },
  medium: { label: 'Medium', cls: 'text-amber-700 bg-amber-50 border-amber-300' },
  low: { label: 'Low', cls: 'text-brand-strong bg-brand-soft border-brand/30' },
  ok: { label: 'OK', cls: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
};

/** Text version of a result, for the clipboard. */
export function findingsText(title: string, checkedAt: string, score: Score, extra: string[] = []): string {
  return [
    title,
    `Checked: ${new Date(checkedAt).toLocaleString()}`,
    `Grade: ${score.grade} (${score.score}/100)`,
    '',
    ...score.findings
      .filter((f) => f.severity !== 'ok')
      .flatMap((f) => [`[${SEVERITY_STYLE[f.severity].label}] ${f.title}`, `  Impact: ${f.impact}`, `  Fix: ${f.recommendation}`, '']),
    ...extra,
  ].join('\n');
}
