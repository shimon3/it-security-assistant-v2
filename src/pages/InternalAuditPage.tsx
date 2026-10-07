import { ClipboardCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { GradeCard } from '../components/AuditResult';
import { useAuditSession, updateSession } from '../utils/auditSession';
import {
  INTERNAL_CONTROLS,
  emptyInternalAudit,
  hasAssessedInternalControls,
  scoreInternalAudit,
  type InternalAnswer,
  type InternalAuditData,
  type InternalControlId,
} from '../utils/internalAudit';
import { useLanguage } from '../i18n';

const ANSWERS: { value: InternalAnswer; en: string; he: string }[] = [
  { value: 'yes', en: 'Yes', he: 'כן' },
  { value: 'partial', en: 'Partial', he: 'חלקי' },
  { value: 'no', en: 'No', he: 'לא' },
  { value: 'unknown', en: 'Not verified', he: 'לא נבדק' },
  { value: 'na', en: 'N/A', he: 'לא רלוונטי' },
];

function answerClass(value: InternalAnswer, selected: boolean): string {
  if (!selected) return 'border-line bg-surface text-ink-2 hover:border-brand';
  if (value === 'yes') return 'border-emerald-300 bg-emerald-50 text-emerald-800';
  if (value === 'partial') return 'border-amber-300 bg-amber-50 text-amber-800';
  if (value === 'no') return 'border-red-300 bg-red-50 text-red-800';
  return 'border-slate-300 bg-slate-50 text-slate-700';
}

export default function InternalAuditPage() {
  const session = useAuditSession();
  const { language, t } = useLanguage();
  const data = session.internalAudit ?? emptyInternalAudit();
  const assessed = hasAssessedInternalControls(data);
  const score = assessed ? scoreInternalAudit(data) : null;
  const answered = INTERNAL_CONTROLS.filter((c) => data.answers[c.id] !== 'unknown').length;

  function updateAnswer(id: InternalControlId, answer: InternalAnswer) {
    const next: InternalAuditData = {
      ...data,
      answers: { ...data.answers, [id]: answer },
    };
    const allReviewed = INTERNAL_CONTROLS.every((c) => next.answers[c.id] !== 'unknown');
    next.completedAt = allReviewed ? new Date().toISOString() : null;
    updateSession({ internalAudit: next });
  }

  function updateNotes(notes: string) {
    updateSession({ internalAudit: { ...data, notes } });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PageHeader
        icon={<ClipboardCheck className="w-5 h-5" />}
        title={t('internalAuditTitle')}
        description={t('internalAuditDesc')}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{t('internalAuditProgress')}</p>
              <p className="text-sm text-muted mt-0.5">{answered} / {INTERNAL_CONTROLS.length} {t('internalAuditReviewed')}</p>
            </div>
            {score && (
              <div className="text-sm text-ink-2">
                {t('grade')}: <span className="font-bold text-ink">{score.grade}</span> · {score.score}/100
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">{t('internalAuditPrivacy')}</p>
        </div>

        <div className="space-y-4">
          {INTERNAL_CONTROLS.map((control, index) => (
            <section key={control.id} className="rounded-xl border border-line bg-surface p-5">
              <div className="flex gap-3">
                <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-ink-2">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-ink">
                    {language === 'he' ? control.labelHe : control.labelEn}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {language === 'he' ? control.helpHe : control.helpEn}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {ANSWERS.map((option) => {
                      const selected = data.answers[control.id] === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => updateAnswer(control.id, option.value)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${answerClass(option.value, selected)}`}
                          aria-pressed={selected}
                        >
                          {language === 'he' ? option.he : option.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <label className="block rounded-xl border border-line bg-surface p-5">
          <span className="font-semibold text-ink">{t('internalAuditNotes')}</span>
          <span className="block mt-1 text-sm text-muted">{t('internalAuditNotesHint')}</span>
          <textarea
            value={data.notes}
            onChange={(e) => updateNotes(e.target.value)}
            rows={4}
            className="mt-3 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
            placeholder={t('internalAuditNotesPlaceholder')}
          />
        </label>

        {score && (
          <GradeCard
            subject={t('internalAuditTitle')}
            score={score}
            copyText=""
          />
        )}
      </div>
    </div>
  );
}
