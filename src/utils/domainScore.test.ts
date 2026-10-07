import { describe, expect, it } from 'vitest';
import { gradeFor, parseTags, scoreDomain, spfAllQualifier, type DomainAuditData } from './domainScore';

const base: DomainAuditData = {
  domain: 'example.co.il',
  exists: true,
  dnssec: true,
  mx: ['1 smtp.google.com'],
  spf: { records: ['v=spf1 include:_spf.google.com -all'], lookups: 4 },
  dmarc: { records: ['v=DMARC1; p=reject; rua=mailto:d@example.co.il'] },
  dkim: { found: [{ selector: 'google', record: 'v=DKIM1; p=abc' }], checked: ['google'] },
  mtaSts: 'v=STSv1; id=1',
  tlsRpt: 'v=TLSRPTv1; rua=mailto:t@example.co.il',
  checkedAt: '2026-10-07T00:00:00Z',
};

const ids = (d: DomainAuditData) => scoreDomain(d).findings.map((f) => f.id);

describe('scoreDomain', () => {
  it('gives A and no problem to a fully configured domain', () => {
    const s = scoreDomain(base);
    expect(s.grade).toBe('A');
    expect(s.score).toBe(100);
    expect(s.findings.every((f) => f.severity === 'ok')).toBe(true);
  });

  it('gives E to a domain with no SPF, DMARC or DKIM', () => {
    const s = scoreDomain({ ...base, dnssec: false, spf: { records: [], lookups: null }, dmarc: { records: [] }, dkim: { found: [], checked: ['google'] }, mtaSts: null, tlsRpt: null });
    expect(s.grade).toBe('E');
    expect(s.findings[0].severity).toBe('critical');
    expect(ids({ ...base, dmarc: { records: [] } })).toContain('dmarc-missing');
  });

  it('treats DMARC p=none as high severity', () => {
    const s = scoreDomain({ ...base, dmarc: { records: ['v=DMARC1; p=none; rua=mailto:x@y.z'] } });
    expect(s.findings.find((f) => f.id === 'dmarc-none')?.severity).toBe('high');
  });

  it('flags "+all", "?all" and missing "all"', () => {
    expect(ids({ ...base, spf: { records: ['v=spf1 +all'], lookups: 0 } })).toContain('spf-pass-all');
    expect(ids({ ...base, spf: { records: ['v=spf1 all'], lookups: 0 } })).toContain('spf-pass-all');
    expect(ids({ ...base, spf: { records: ['v=spf1 mx ?all'], lookups: 1 } })).toContain('spf-neutral');
    expect(ids({ ...base, spf: { records: ['v=spf1 mx'], lookups: 1 } })).toContain('spf-neutral');
  });

  it('flags more than 10 SPF lookups and duplicate records', () => {
    expect(ids({ ...base, spf: { records: ['v=spf1 include:a include:b -all'], lookups: 12 } })).toContain('spf-too-many-lookups');
    expect(ids({ ...base, spf: { records: ['v=spf1 -all', 'v=spf1 mx -all'], lookups: null } })).toContain('spf-multiple');
  });

  it('flags partial DMARC, missing reports and missing DKIM', () => {
    expect(ids({ ...base, dmarc: { records: ['v=DMARC1; p=quarantine; pct=50'] } })).toEqual(
      expect.arrayContaining(['dmarc-quarantine', 'dmarc-pct', 'dmarc-no-reports']),
    );
    expect(ids({ ...base, dkim: { found: [], checked: ['google'] } })).toContain('dkim-not-found');
  });

  it('does not ask for MTA-STS on a domain without email', () => {
    expect(ids({ ...base, mx: [], mtaSts: null, tlsRpt: null })).not.toContain('mta-sts-missing');
  });

  it('sorts findings from most to least severe', () => {
    const order = ['critical', 'high', 'medium', 'low', 'ok'];
    const sev = scoreDomain({ ...base, dnssec: false, dmarc: { records: [] }, spf: { records: ['v=spf1 ?all'], lookups: 0 } }).findings.map((f) => order.indexOf(f.severity));
    expect(sev).toEqual([...sev].sort((a, b) => a - b));
  });
});

describe('helpers', () => {
  it('parses DMARC tags', () => {
    expect(parseTags('v=DMARC1; p=reject; rua=mailto:a@b.c; pct=100')).toEqual({ v: 'DMARC1', p: 'reject', rua: 'mailto:a@b.c', pct: '100' });
  });
  it('reads the SPF all qualifier', () => {
    expect(spfAllQualifier('v=spf1 -all')).toBe('-');
    expect(spfAllQualifier('v=spf1 ~all')).toBe('~');
    expect(spfAllQualifier('v=spf1 mx')).toBeNull();
  });
  it('maps scores to grades', () => {
    expect([100, 90, 89, 75, 60, 40, 39].map(gradeFor)).toEqual(['A', 'A', 'B', 'B', 'C', 'D', 'E']);
  });
});
