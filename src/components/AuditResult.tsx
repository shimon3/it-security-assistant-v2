import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { countSerious, type Finding, type Grade, type Score } from '../utils/findings';
import { GRADE_STYLE, SEVERITY_STYLE } from '../utils/findingsStyle';

export function GradeBadge({ grade, size = 'lg' }: { grade: Grade; size?: 'lg' | 'sm' }) {
  const dims = size === 'lg' ? 'h-20 w-20 text-5xl border-[3px] rounded-2xl' : 'h-11 w-11 text-2xl border-2 rounded-xl';
  return (
    <div className={`flex shrink-0 items-center justify-center font-bold leading-none ${dims} ${GRADE_STYLE[grade]}`} aria-label={`Grade ${grade}`}>
      {grade}
    </div>
  );
}

interface GradeCardProps {
  subject: string;
  score: Score;
  /** Plain-text summary put on the clipboard by the Copy button. */
  copyText: string;
}

export function GradeCard({ subject, score, copyText }: GradeCardProps) {
  const [copied, setCopied] = useState(false);
  const serious = countSerious(score.findings);

  async function copy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <GradeBadge grade={score.grade} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted truncate">{subject}</p>
        <p className="text-2xl font-semibold text-ink">{score.score} / 100</p>
        <p className="text-sm text-ink-2">
          {serious === 0 ? 'No serious problem' : serious === 1 ? '1 serious problem' : `${serious} serious problems`}
        </p>
      </div>
      <button
        onClick={copy}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink border border-line hover:border-line-strong px-3 py-1.5 rounded-lg transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export function FindingList({ findings }: { findings: Finding[] }) {
  return (
    <ul className="space-y-3">
      {findings.map((f) => (
        <li key={f.id} className="rounded-xl border border-line bg-surface p-4 space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[f.severity].cls}`}>
              {SEVERITY_STYLE[f.severity].label}
            </span>
            <span className="shrink-0 rounded-md border border-line-strong px-2 py-0.5 text-xs text-muted">{f.control}</span>
            <p className="text-sm font-medium text-ink basis-full sm:basis-auto sm:flex-1">{f.title}</p>
          </div>
          {f.severity !== 'ok' && (
            <>
              <p className="text-sm text-ink-2">{f.impact}</p>
              <p className="text-sm text-ink">
                <span className="text-muted">Fix: </span>
                {f.recommendation}
              </p>
            </>
          )}
          {f.detail && (
            <pre className="whitespace-pre-wrap break-all rounded-md bg-sunken px-3 py-2 font-mono text-xs text-ink-2">{f.detail}</pre>
          )}
        </li>
      ))}
    </ul>
  );
}
