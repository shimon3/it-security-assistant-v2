import { ClipboardCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { GradeCard } from '../components/AuditResult';
import { useAuditSession, updateSession } from '../utils/auditSession';
import {
  INTERNAL_CONTROLS,
  INTERNAL_CATEGORIES,
  emptyInternalAudit,
  hasAssessedInternalControls,
  scoreInternalAudit,
  internalScoreCaps,
  type InternalAnswer,
  type InternalAuditData,
  type InternalControlId,
  type EvidenceStatus,
} from '../utils/internalAudit';
import { useLanguage } from '../i18n';
import { emptyClientEnvironment, type ClientEnvironment, type EmailPlatform, type Presence } from '../utils/clientEnvironment';

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
  const environment = session.clientEnvironment ?? emptyClientEnvironment();
  const assessed = hasAssessedInternalControls(data);
  const score = assessed ? scoreInternalAudit(data) : null;
  const answered = INTERNAL_CONTROLS.filter((c) => (data.answers?.[c.id] ?? 'unknown') !== 'unknown').length;
  const caps = internalScoreCaps(data);

  function updateEnvironment(patch: Partial<ClientEnvironment>) {
    updateSession({ clientEnvironment: { ...environment, ...patch } });
  }

  function updateAnswer(id: InternalControlId, answer: InternalAnswer) {
    const next: InternalAuditData = {
      ...data,
      answers: { ...data.answers, [id]: answer },
    };
    const allReviewed = INTERNAL_CONTROLS.every((c) => (next.answers?.[c.id] ?? 'unknown') !== 'unknown');
    next.completedAt = allReviewed ? new Date().toISOString() : null;
    updateSession({ internalAudit: next });
  }

  function updateEvidence(id: InternalControlId, evidence: EvidenceStatus) {
    updateSession({
      internalAudit: {
        ...data,
        evidence: { ...data.evidence, [id]: evidence },
      },
    });
  }

  function updateObservation(id: InternalControlId, observation: string) {
    updateSession({
      internalAudit: {
        ...data,
        observations: { ...data.observations, [id]: observation },
      },
    });
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
        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-ink">{t('clientEnvironmentTitle')}</h2>
            <p className="mt-1 text-sm text-muted">{t('clientEnvironmentDesc')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentUsers')}
              <input
                value={environment.users}
                onChange={(e) => updateEnvironment({ users: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) })}
                inputMode="numeric"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                placeholder="25"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentEndpoints')}
              <input
                value={environment.endpoints}
                onChange={(e) => updateEnvironment({ endpoints: e.target.value.replace(/[^0-9]/g, '').slice(0, 5) })}
                inputMode="numeric"
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                placeholder="30"
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentEmailPlatform')}
              <select
                value={environment.emailPlatform}
                onChange={(e) => updateEnvironment({ emailPlatform: e.target.value as EmailPlatform })}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
              >
                <option value="">{t('environmentNotSpecified')}</option>
                <option value="microsoft365">Microsoft 365</option>
                <option value="googleWorkspace">Google Workspace</option>
                <option value="other">{t('environmentOther')}</option>
                <option value="none">{t('environmentNoEmail')}</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentServers')}
              <select
                value={environment.servers}
                onChange={(e) => updateEnvironment({ servers: e.target.value as Presence })}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
              >
                <option value="">{t('environmentNotSpecified')}</option>
                <option value="yes">{t('answerYes')}</option>
                <option value="no">{t('answerNo')}</option>
                <option value="unknown">{t('answerUnknown')}</option>
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentEndpointProtection')}
              <input
                value={environment.endpointProtection}
                onChange={(e) => updateEnvironment({ endpointProtection: e.target.value.slice(0, 100) })}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                placeholder="Microsoft Defender / Sophos / ..."
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2">
              {t('environmentBackup')}
              <input
                value={environment.backupSolution}
                onChange={(e) => updateEnvironment({ backupSolution: e.target.value.slice(0, 100) })}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                placeholder="Acronis / Veeam / ..."
              />
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink-2 sm:col-span-2">
              {t('environmentRemoteAccess')}
              <input
                value={environment.remoteAccess}
                onChange={(e) => updateEnvironment({ remoteAccess: e.target.value.slice(0, 120) })}
                className="w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                placeholder="VPN / RDP / AnyDesk / none"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-muted">{t('clientEnvironmentNotScored')}</p>
        </section>
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

        <div className="space-y-7">
          {INTERNAL_CATEGORIES.map((category) => {
            const controls = INTERNAL_CONTROLS.filter((control) => control.category === category.id);
            return (
              <section key={category.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-ink">{language === 'he' ? category.labelHe : category.labelEn}</h2>
                  <span className="text-xs text-muted">{controls.length}</span>
                  <div className="h-px flex-1 bg-line" />
                </div>
                {controls.map((control) => {
                  const index = INTERNAL_CONTROLS.findIndex((item) => item.id === control.id);
                  const answer = data.answers?.[control.id] ?? 'unknown';
                  return (
                    <section key={control.id} className="rounded-xl border border-line bg-surface p-5">
                      <div className="flex gap-3">
                        <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-ink-2">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-ink">
                            {language === 'he' ? control.labelHe : control.labelEn}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            {language === 'he' ? control.helpHe : control.helpEn}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {ANSWERS.map((option) => {
                              const selected = answer === option.value;
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

                          <div className="mt-4">
                            <p className="text-xs font-medium text-ink-2">{t('internalAuditEvidence')}</p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              {([
                                ['client', t('internalAuditEvidenceClient')],
                                ['verified', t('internalAuditEvidenceVerified')],
                                ['unverified', t('internalAuditEvidenceUnverified')],
                              ] as const).map(([value, label]) => {
                                const selected = (data.evidence?.[control.id] ?? 'unverified') === value;
                                return (
                                  <button
                                    type="button"
                                    key={value}
                                    onClick={() => updateEvidence(control.id, value)}
                                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${selected ? 'border-brand bg-brand-soft text-brand-strong' : 'border-line bg-surface text-ink-2 hover:border-brand'}`}
                                    aria-pressed={selected}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <label className="mt-4 block">
                            <span className="text-xs font-medium text-ink-2">{t('internalAuditObservation')}</span>
                            <textarea
                              value={data.observations?.[control.id] ?? ''}
                              onChange={(e) => updateObservation(control.id, e.target.value)}
                              rows={2}
                              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                              placeholder={t('internalAuditObservationPlaceholder')}
                            />
                          </label>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </section>
            );
          })}
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
          <>
            {caps.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <p className="font-semibold">{language === 'he' ? 'הגבלת ציון בגלל בקרות קריטיות' : 'Score capped by critical controls'}</p>
                <ul className="mt-2 list-disc ps-5 space-y-1 text-sm">
                  {caps.map((cap) => (
                    <li key={cap.controlId}>
                      {language === 'he' ? cap.reasonHe : cap.reasonEn} {language === 'he' ? 'ציון מרבי' : 'Maximum score'}: {cap.maxScore}/100.
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <GradeCard
              subject={t('internalAuditTitle')}
              score={score}
              copyText=""
            />
          </>
        )}
      </div>
    </div>
  );
}
