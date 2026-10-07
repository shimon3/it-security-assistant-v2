import { describe, expect, it } from 'vitest';
import { analyzeEmail } from './emailAnalyzer';

// Anonymised examples modelled on real phishing seen in Israel.
const BANK_PHISH = `שלום,
חשבונך הוגבל. יש לאמת את פרטיך באופן מיידי.
Your account is suspended. Please verify your login immediately:
http://leumi-secure-login.xyz/verify?id=1234
Call us at 1-900-123456`;

const BENIGN = `Hi team,
Attached are the minutes from Tuesday's meeting. See you next week.
Thanks, Dana`;

describe('analyzeEmail', () => {
  it('rates an obvious bank phishing email as High', () => {
    const r = analyzeEmail('security@leumi-alerts.top', BANK_PHISH);
    expect(r.level).toBe('High');
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(r.suspiciousUrls.map((u) => u.url)).toContain('http://leumi-secure-login.xyz/verify?id=1234');
  });

  it('rates an ordinary internal email as Low', () => {
    const r = analyzeEmail('dana@company.co.il', BENIGN);
    expect(r.level).toBe('Low');
    expect(r.score).toBeLessThan(25);
    expect(r.suspiciousUrls).toHaveLength(0);
  });

  it('never returns a score above 100', () => {
    const r = analyzeEmail('x@micr0soft.top', `${BANK_PHISH}\n`.repeat(20));
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it('flags Israeli premium-rate numbers, with or without separators', () => {
    for (const phone of ['1-900-123456', '1 900 123456', '1900123456']) {
      const r = analyzeEmail('a@b.com', `Call ${phone} now`);
      expect(r.issues.join(' ')).toMatch(/1-900/);
    }
  });

  it('strips trailing punctuation and closing parentheses from URLs', () => {
    const r = analyzeEmail('a@b.com', 'Login (http://paypa1-login.xyz/a). Then http://paypa1-login.xyz/b, please!');
    const urls = r.suspiciousUrls.map((u) => u.url);
    expect(urls).toContain('http://paypa1-login.xyz/a');
    expect(urls).toContain('http://paypa1-login.xyz/b');
    expect(urls.some((u) => /[).,!]$/.test(u))).toBe(false);
  });

  it('always gives an explanation and recommendations', () => {
    for (const body of [BANK_PHISH, BENIGN]) {
      const r = analyzeEmail('a@b.com', body);
      expect(r.explanation.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    expect(analyzeEmail('a@b.com', BANK_PHISH)).toEqual(analyzeEmail('a@b.com', BANK_PHISH));
  });
});
