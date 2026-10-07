import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { countSerious, type Finding, type Grade, type Score } from '../utils/findings';
import { GRADE_STYLE, SEVERITY_STYLE } from '../utils/findingsStyle';
import { heText, SEVERITY_HE } from '../utils/reportHe';
import { useLanguage } from '../i18n';

export function GradeBadge({ grade, size = 'lg' }: { grade: Grade; size?: 'lg' | 'sm' }) {
  const { t } = useLanguage();
  const dims = size === 'lg' ? 'h-20 w-20 text-5xl border-[3px] rounded-2xl' : 'h-11 w-11 text-2xl border-2 rounded-xl';
  return (
    <div className={`flex shrink-0 items-center justify-center font-bold leading-none ${dims} ${GRADE_STYLE[grade]}`} aria-label={`${t('grade')} ${grade}`}>
      {grade}
    </div>
  );
}

interface GradeCardProps {
  subject: string;
  score: Score;
  copyText: string;
}

export function GradeCard({ subject, score, copyText }: GradeCardProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();
  const serious = countSerious(score.findings);

  async function copy() {
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const seriousText = serious === 0 ? t('seriousNone') : serious === 1 ? t('seriousOne') : `${serious} ${t('seriousMany')}`;

  return (
    <div className="flex items-center gap-5 rounded-xl border border-line bg-surface p-5 sm:p-6">
      <GradeBadge grade={score.grade} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted truncate" dir="ltr">{subject}</p>
        <p className="text-2xl font-semibold text-ink" dir="ltr">{score.score} / 100</p>
        <p className="text-sm text-ink-2">{seriousText}</p>
      </div>
      <button onClick={copy} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink border border-line hover:border-line-strong px-3 py-1.5 rounded-lg transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}

export function FindingList({ findings }: { findings: Finding[] }) {
  const { language, t } = useLanguage();

  return (
    <ul className="space-y-3">
      {findings.map((f) => {
        const he = language === 'he' ? heText(f) : null;
        return (
          <li key={f.id} className="rounded-xl border border-line bg-surface p-4 space-y-2">
            <div className="flex flex-wrap items-start gap-2">
              <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[f.severity].cls}`}>
                {language === 'he' ? SEVERITY_HE[f.severity] : SEVERITY_STYLE[f.severity].label}
              </span>
              <span className="shrink-0 rounded-md border border-line-strong px-2 py-0.5 text-xs text-muted" dir="ltr">{f.control}</span>
              <p className="text-sm font-medium text-ink basis-full sm:basis-auto sm:flex-1">{he?.title ?? f.title}</p>
            </div>
            {f.severity !== 'ok' && (
              <>
                <p className="text-sm text-ink-2">{he?.impact ?? f.impact}</p>
                <p className="text-sm text-ink">
                  <span className="text-muted">{t('fix')}: </span>
                  {he?.fix ?? f.recommendation}
                </p>
              </>
            )}
            {f.detail && <pre dir="ltr" className="text-left whitespace-pre-wrap break-all rounded-md bg-sunken px-3 py-2 font-mono text-xs text-ink-2">{f.detail}</pre>}
          </li>
        );
      })}
    </ul>
  );
}
