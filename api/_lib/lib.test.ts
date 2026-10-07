import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { guard, readJson } from './http';
import { checkRateLimit, resetInMemoryRateLimit } from './ratelimit';
import { normalizeDomain } from './domain';
import { urlId } from './virustotal';
import { isValidIp } from '../vt-ip';

const TOKEN = 'a-very-long-test-token-123';

function req(init: { method?: string; token?: string; ip?: string; body?: string } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'x-forwarded-for': init.ip ?? '198.51.100.1' };
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  return new Request('https://app.test/api/x', {
    method: init.method ?? 'POST',
    headers,
    body: (init.method ?? 'POST') === 'POST' ? init.body ?? '{}' : undefined,
  });
}

describe('guard', () => {
  beforeEach(() => {
    process.env.ACCESS_TOKEN = TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetInMemoryRateLimit();
  });
  afterEach(() => {
    delete process.env.ACCESS_TOKEN;
  });

  it('accepts POST with the right token', async () => {
    expect(await guard(req({ token: TOKEN }), 't')).toBeNull();
  });

  it('rejects other methods with 405', async () => {
    expect((await guard(req({ method: 'GET', token: TOKEN }), 't'))?.status).toBe(405);
  });

  it('rejects a missing or wrong token with 401', async () => {
    expect((await guard(req(), 't'))?.status).toBe(401);
    expect((await guard(req({ token: TOKEN + 'x' }), 't'))?.status).toBe(401);
    expect((await guard(req({ token: TOKEN.slice(0, -1) }), 't'))?.status).toBe(401);
  });

  it('fails closed with 500 when ACCESS_TOKEN is missing or too short', async () => {
    delete process.env.ACCESS_TOKEN;
    expect((await guard(req({ token: 'anything' }), 't'))?.status).toBe(500);
    process.env.ACCESS_TOKEN = 'short';
    expect((await guard(req({ token: 'short' }), 't'))?.status).toBe(500);
  });

  it('returns 429 with Retry-After after 10 requests per minute from one IP', async () => {
    for (let i = 0; i < 10; i++) expect(await guard(req({ token: TOKEN }), 't')).toBeNull();
    const blocked = await guard(req({ token: TOKEN }), 't');
    expect(blocked?.status).toBe(429);
    expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('also rate-limits token guessing', async () => {
    for (let i = 0; i < 10; i++) await guard(req({ token: 'wrong' }), 't');
    expect((await guard(req({ token: 'wrong' }), 't'))?.status).toBe(429);
  });

  it('counts IPs and routes separately', async () => {
    for (let i = 0; i < 10; i++) await guard(req({ token: TOKEN }), 'route-a');
    expect(await guard(req({ token: TOKEN, ip: '203.0.113.7' }), 'route-a')).toBeNull();
    expect(await guard(req({ token: TOKEN }), 'route-b')).toBeNull();
  });
});

describe('checkRateLimit', () => {
  it('opens a new window after a minute', async () => {
    resetInMemoryRateLimit();
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i++) await checkRateLimit('k', t0);
    expect((await checkRateLimit('k', t0)).allowed).toBe(false);
    expect((await checkRateLimit('k', t0 + 61_000)).allowed).toBe(true);
  });
});

describe('readJson', () => {
  it('accepts objects only', async () => {
    expect(await readJson(req({ body: '{"a":1}' }))).toEqual({ a: 1 });
    expect(await readJson(req({ body: '[1]' }))).toBeNull();
    expect(await readJson(req({ body: 'not json' }))).toBeNull();
  });
});

describe('normalizeDomain', () => {
  it('extracts the hostname from URLs and mixed input', () => {
    expect(normalizeDomain('https://www.Example.co.il/path?q=1')).toBe('www.example.co.il');
    expect(normalizeDomain('example.com:443')).toBe('example.com');
    expect(normalizeDomain('user@mail.example.com')).toBe('mail.example.com');
    expect(normalizeDomain('example.com.')).toBe('example.com');
  });

  it('rejects anything that is not a public hostname', () => {
    for (const bad of ['', 'localhost', '192.168.1.1', '-bad.com', 'bad-.com', 'a..b.com', 'ex ample.com', 'x'.repeat(64) + '.com']) {
      expect(normalizeDomain(bad)).toBeNull();
    }
  });
});

describe('VirusTotal helpers', () => {
  it('builds unpadded base64url ids, including for non-ASCII URLs', () => {
    expect(urlId('http://a.com')).toBe('aHR0cDovL2EuY29t');
    expect(urlId('https://xn--e1a.example/ש')).not.toMatch(/[+/=]/);
  });

  it('validates IP addresses', () => {
    expect(isValidIp('8.8.8.8')).toBe(true);
    expect(isValidIp('2001:4860:4860::8888')).toBe(true);
    expect(isValidIp('256.1.1.1')).toBe(false);
    expect(isValidIp('example.com')).toBe(false);
  });
});
