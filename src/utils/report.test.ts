import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildReport } from './report';
import { hasHebrew, heText } from './reportHe';
import { demoDomainAudit, demoHttpHeaders } from './demoMode';
import { scoreDomain } from './domainScore';
import type { HttpHeadersData } from './httpHeadersScore';

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
  const base = { clientName: 'Example Shop', auditor: 'Samuel', domain: 'example-shop.co.il', date: new Date('2026-10-07') };

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

  it('lists only easy, meaningful fixes for this week', () => {
    const r = buildReport({ ...base, domainAudit: demoDomainAudit(base.domain), httpHeaders: demoHttpHeaders(base.domain) })!;
    expect(r.thisWeek.length).toBeGreaterThan(0);
    expect(r.thisWeek.length).toBeLessThanOrEqual(5);
    expect(r.thisWeek.every((p) => p.he.effort === 'easy' && p.finding.severity !== 'low')).toBe(true);
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
