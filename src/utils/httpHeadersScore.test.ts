import { describe, expect, it } from 'vitest';
import { hstsMaxAge, isHttpHeadersInconclusive, parseCsp, scoreHttpHeaders, type HttpHeadersData } from './httpHeadersScore';

const good: HttpHeadersData = {
  domain: 'good.co.il',
  https: {
    ok: true, status: 200, finalUrl: 'https://good.co.il/', chain: [{ url: 'https://good.co.il/', status: 200 }],
    headers: {
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'content-security-policy': "default-src 'self'; frame-ancestors 'none'",
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'permissions-policy': 'camera=()',
      server: 'cloudflare',
    },
  },
  http: { redirectsToHttps: true, status: 301, location: 'https://good.co.il/' },
  checkedAt: '2026-10-07T00:00:00Z',
};

const withHeaders = (headers: Record<string, string>): HttpHeadersData => ({ ...good, https: { ...good.https, headers } });
const ids = (d: HttpHeadersData) => scoreHttpHeaders(d).findings.map((f) => f.id);

describe('scoreHttpHeaders', () => {
  it('gives A to a well-configured site', () => {
    const s = scoreHttpHeaders(good);
    expect(s.grade).toBe('A');
    expect(s.findings.every((f) => f.severity === 'ok')).toBe(true);
  });

  it('gives a typical small-business site with no headers a low grade', () => {
    const s = scoreHttpHeaders({ ...withHeaders({ server: 'Apache/2.4.41 (Ubuntu)', 'x-powered-by': 'PHP/7.4.3' }), http: { redirectsToHttps: false, status: 200, location: null } });
    expect(['D', 'E']).toContain(s.grade);
    expect(s.findings.map((f) => f.id)).toEqual(
      expect.arrayContaining(['no-https-redirect', 'hsts-missing', 'csp-missing', 'clickjacking', 'nosniff-missing', 'version-disclosed']),
    );
  });

  it('marks the website audit inconclusive when neither HTTP nor HTTPS answers', () => {
    const d: HttpHeadersData = {
      ...good,
      https: { ok: false, status: null, finalUrl: null, chain: [], headers: {}, error: 'Could not connect' },
      http: { redirectsToHttps: null, status: null, location: null, error: 'Could not connect' },
    };
    expect(isHttpHeadersInconclusive(d)).toBe(true);
    expect(scoreHttpHeaders(d).findings).toEqual([]);
  });

  it('keeps a critical HTTPS finding when HTTP answers but HTTPS does not', () => {
    const d: HttpHeadersData = {
      ...good,
      https: { ok: false, status: null, finalUrl: null, chain: [], headers: {}, error: 'Could not connect' },
      http: { redirectsToHttps: false, status: 200, location: null },
    };
    expect(isHttpHeadersInconclusive(d)).toBe(false);
    const s = scoreHttpHeaders(d);
    expect(s.findings.map((f) => f.id)).toEqual(['https-unreachable']);
    expect(s.score).toBe(60);
  });

  it('flags a short HSTS and accepts frame-ancestors instead of X-Frame-Options', () => {
    expect(ids(withHeaders({ ...good.https.headers, 'strict-transport-security': 'max-age=86400' }))).toContain('hsts-short');
    expect(ids(good)).not.toContain('clickjacking');
    expect(ids(withHeaders({ ...good.https.headers, 'content-security-policy': "default-src 'self'" }))).toContain('clickjacking');
    expect(ids(withHeaders({ ...good.https.headers, 'content-security-policy': "default-src 'self'", 'x-frame-options': 'DENY' }))).not.toContain('clickjacking');
  });

  it('separates report-only CSP and unsafe-inline scripts', () => {
    const noCsp = { ...good.https.headers } as Record<string, string>;
    delete noCsp['content-security-policy'];
    expect(ids(withHeaders({ ...noCsp, 'content-security-policy-report-only': "default-src 'self'" }))).toContain('csp-report-only');
    expect(ids(withHeaders({ ...good.https.headers, 'content-security-policy': "script-src 'self' 'unsafe-inline'; frame-ancestors 'none'" }))).toContain('csp-unsafe-inline');
    expect(ids(withHeaders({ ...good.https.headers, 'content-security-policy': "script-src 'self' 'unsafe-inline' 'nonce-abc'; frame-ancestors 'none'" }))).not.toContain('csp-unsafe-inline');
  });

  it('does not flag a server name without a version', () => {
    expect(ids(good)).not.toContain('version-disclosed');
  });
});

describe('helpers', () => {
  it('reads HSTS max-age', () => {
    expect(hstsMaxAge('max-age=31536000; includeSubDomains')).toBe(31536000);
    expect(hstsMaxAge('max-age="600"')).toBe(600);
    expect(hstsMaxAge('includeSubDomains')).toBeNull();
  });
  it('parses CSP directives', () => {
    expect(parseCsp("default-src 'self'; Script-Src 'self' cdn.example")).toEqual({ 'default-src': "'self'", 'script-src': "'self' cdn.example" });
  });
});
