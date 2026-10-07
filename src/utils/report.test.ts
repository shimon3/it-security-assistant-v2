import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildReport } from './report';
import { hasHebrew, heText } from './reportHe';
import { demoDomainAudit, demoHttpHeaders } from './demoMode';
import { scoreDomain } from './domainScore';
import type { HttpHeadersData } from './httpHeadersScore';
import { emptyInternalAudit } from './internalAudit';

function findingIds(file: string): string[] {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  return [...src.matchAll(/id: (?:cspRo \? )?'([a-z0-9-]+)'(?: : '([a-z0-9-]+)')?/g)].flatMap((m) => [m[1], m[2]].filter(Boolean));
}

describe('Hebrew report wording', () => {
  it('has a Hebrew text for every finding the checks can produce', () => {
    const ids = [...findingIds('./domainScore.ts'), ...findingIds('./httpHeadersScore.ts')];
    expect(ids.length).toBeGreaterThan(30);
    expect(ids.filter((id) => !hasHebrew(id))).toEqual([]);
  });

  it('fills in numbers from the finding', () => {
    const s = scoreDomain({ ...demoDomainAudit('x.co.il'), spf: { records: ['v=spf1 -all'], lookups: 14 } });
    const f = s.findings.find((x) => x.id === 'spf-too-many-lookups')!;
    expect(heText(f).title).toContain('14');
  });
});

describe('buildReport', () => {
  const base = { clientName: 'Example Shop', auditor: 'Samuel', domain: 'example-shop.co.il', date: new Date('2026-10-07'), internalAudit: null };

  it('returns nothing before any check has run', () => {
    expect(buildReport({ ...base, domainAudit: null, httpHeaders: null })).toBeNull();
  });

  it('averages the section scores and orders problems by severity then effort', () => {
    const r = buildReport({ ...base, domainAudit: demoDomainAudit(base.domain), httpHeaders: demoHttpHeaders(base.domain) })!;
    expect(r.sections.map((s) => s.key)).toEqual(['email', 'web']);
    expect(r.overall!.score).toBe(Math.round((r.sections[0].score.score + r.sections[1].score.score) / 2));
    const order = ['critical', 'high', 'medium', 'low'];
    const sev = r.problems.map((p) => order.indexOf(p.finding.severity));
    expect(sev).toEqual([...sev].sort((a, b) => a - b));
    expect(r.topRisks).toHaveLength(3);
    expect(r.problems.every((p) => p.finding.severity !== 'ok')).toBe(true);
  });

  it('builds a non-overlapping 7 / 30 / 90 day remediation plan', () => {
    const internalAudit = emptyInternalAudit();
    for (const key of Object.keys(internalAudit.answers) as Array<keyof typeof internalAudit.answers>) {
      internalAudit.answers[key] = 'yes';
    }
    internalAudit.answers.mfa = 'no';
    internalAudit.answers.filePermissions = 'partial';
    internalAudit.answers.networkSegmentation = 'no';
    internalAudit.answers.phishingTraining = 'no';

    const r = buildReport({
      ...base,
      domainAudit: demoDomainAudit(base.domain),
      httpHeaders: demoHttpHeaders(base.domain),
      internalAudit,
    })!;

    const plan = r.remediationPlan;
    const allPlanIds = [...plan.days7, ...plan.days30, ...plan.days90].map((x) => x.finding.id);
    expect(allPlanIds).toHaveLength(r.problems.length);
    expect(new Set(allPlanIds).size).toBe(allPlanIds.length);
    expect(new Set(allPlanIds)).toEqual(new Set(r.problems.map((x) => x.finding.id)));
    expect(plan.days7.some((x) => x.finding.id === 'internal-mfa-no')).toBe(true);
    expect(plan.days30.some((x) => x.finding.id === 'internal-filePermissions-partial')).toBe(true);
    expect(plan.days90.some((x) => x.finding.id === 'internal-networkSegmentation-no')).toBe(true);
    expect(plan.days7.some((x) => x.finding.id === 'internal-phishingTraining-no')).toBe(true);
    expect(r.thisWeek).toEqual(plan.days7.slice(0, 5));
  });

  it('works with a single check', () => {
    const r = buildReport({ ...base, domainAudit: demoDomainAudit(base.domain), httpHeaders: null })!;
    expect(r.sections).toHaveLength(1);
    expect(r.overall!.score).toBe(r.sections[0].score.score);
  });

  it('excludes a fully unreachable website from the overall score', () => {
    const unreachable: HttpHeadersData = {
      domain: base.domain,
      https: { ok: false, status: null, finalUrl: null, chain: [], headers: {}, error: 'Could not connect' },
      http: { redirectsToHttps: null, status: null, location: null, error: 'Could not connect' },
      checkedAt: '2026-10-07T00:00:00Z',
    };
    const r = buildReport({ ...base, domainAudit: demoDomainAudit(base.domain), httpHeaders: unreachable })!;
    expect(r.webInconclusive).toBe(true);
    expect(r.sections.map((s) => s.key)).toEqual(['email']);
    expect(r.overall!.score).toBe(r.sections[0].score.score);
    expect(r.problems.some((p) => p.finding.id === 'https-unreachable')).toBe(false);
  });

  it('adds the internal questionnaire as a third scored section', () => {
    const internalAudit = emptyInternalAudit();
    internalAudit.answers.mfa = 'no';
    internalAudit.answers.backups = 'partial';
    internalAudit.answers.edr = 'yes';

    const r = buildReport({
      ...base,
      domainAudit: demoDomainAudit(base.domain),
      httpHeaders: demoHttpHeaders(base.domain),
      internalAudit,
    })!;

    expect(r.sections.map((s) => s.key)).toEqual(['email', 'web', 'internal']);
    expect(r.sections.find((s) => s.key === 'internal')?.includedInOverall).toBe(false);
    expect(r.problems.some((p) => p.section === 'internal')).toBe(true);
    expect(r.overall!.score).toBe(Math.round((r.sections[0].score.score + r.sections[1].score.score) / 2));
  });

  it('includes a completed internal questionnaire in the overall score', () => {
    const internalAudit = emptyInternalAudit();
    for (const key of Object.keys(internalAudit.answers) as Array<keyof typeof internalAudit.answers>) {
      internalAudit.answers[key] = 'yes';
    }

    const r = buildReport({
      ...base,
      domainAudit: demoDomainAudit(base.domain),
      httpHeaders: null,
      internalAudit,
    })!;

    const internal = r.sections.find((s) => s.key === 'internal')!;
    expect(internal.includedInOverall).toBe(true);
    expect(internal.score.score).toBe(100);
    expect(r.overall!.score).toBe(Math.round((r.sections[0].score.score + 100) / 2));
  });

  it('can produce an N/A report when only an unreachable website check exists', () => {
    const unreachable: HttpHeadersData = {
      domain: base.domain,
      https: { ok: false, status: null, finalUrl: null, chain: [], headers: {}, error: 'Could not connect' },
      http: { redirectsToHttps: null, status: null, location: null, error: 'Could not connect' },
      checkedAt: '2026-10-07T00:00:00Z',
    };
    const r = buildReport({ ...base, domainAudit: null, httpHeaders: unreachable })!;
    expect(r.webInconclusive).toBe(true);
    expect(r.sections).toHaveLength(0);
    expect(r.overall).toBeNull();
  });
});
