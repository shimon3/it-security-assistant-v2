import { describe, expect, it } from 'vitest';
import { checkHeaders } from '../http-headers';
import { isPrivateIPv4, isPrivateIPv6 } from './netguard';

type Site = { status: number; headers?: Record<string, string> };
type Net = {
  dns: Record<string, string[]>; // host -> IPv4 addresses
  pages: Record<string, Site>; // full URL -> response
};

function fakeNet(net: Net) {
  const requested: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.startsWith('https://cloudflare-dns.com/')) {
      const u = new URL(url);
      const name = u.searchParams.get('name')!;
      const type = u.searchParams.get('type');
      const ips = type === 'A' ? net.dns[name] ?? [] : [];
      return new Response(JSON.stringify({ Status: ips.length ? 0 : 3, Answer: ips.map((data) => ({ name, type: 1, TTL: 60, data })) }));
    }
    requested.push(url);
    const page = net.pages[url];
    if (!page) throw new TypeError('connect failed');
    return new Response('<html>secret body</html>', { status: page.status, headers: page.headers });
  }) as typeof fetch;
  return { fetchImpl, requested };
}

describe('checkHeaders', () => {
  it('follows redirects and keeps only security headers', async () => {
    const { fetchImpl } = fakeNet({
      dns: { 'shop.co.il': ['203.0.113.10'], 'www.shop.co.il': ['203.0.113.11'] },
      pages: {
        'https://shop.co.il/': { status: 301, headers: { location: 'https://www.shop.co.il/' } },
        'https://www.shop.co.il/': { status: 200, headers: { 'strict-transport-security': 'max-age=31536000', 'set-cookie': 'sid=1', server: 'nginx' } },
        'http://shop.co.il/': { status: 301, headers: { location: 'https://shop.co.il/' } },
      },
    });
    const d = await checkHeaders('shop.co.il', fetchImpl);
    expect(d.https.ok).toBe(true);
    expect(d.https.finalUrl).toBe('https://www.shop.co.il/');
    expect(d.https.chain.map((h) => h.status)).toEqual([301, 200]);
    expect(d.https.headers).toEqual({ 'strict-transport-security': 'max-age=31536000', server: 'nginx' });
    expect(JSON.stringify(d)).not.toContain('secret body');
    expect(d.http.redirectsToHttps).toBe(true);
  });

  it('refuses hosts that resolve to private addresses, including after a redirect', async () => {
    const { fetchImpl, requested } = fakeNet({
      dns: { 'evil.example': ['203.0.113.5'], 'internal.example': ['10.0.0.5'] },
      pages: { 'https://evil.example/': { status: 302, headers: { location: 'https://internal.example/admin' } } },
    });
    const d = await checkHeaders('evil.example', fetchImpl);
    expect(d.https.ok).toBe(false);
    expect(d.https.error).toBe('Address is not public');
    expect(requested).not.toContain('https://internal.example/admin');
  });

  it('refuses redirects to raw IP addresses', async () => {
    const { fetchImpl, requested } = fakeNet({
      dns: { 'x.example': ['203.0.113.5'] },
      pages: { 'https://x.example/': { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data' } } },
    });
    const d = await checkHeaders('x.example', fetchImpl);
    expect(d.https.ok).toBe(false);
    expect(requested.some((u) => u.includes('169.254'))).toBe(false);
  });

  it('reports a site without HTTPS and without redirect', async () => {
    const { fetchImpl } = fakeNet({
      dns: { 'old.co.il': ['203.0.113.20'] },
      pages: { 'http://old.co.il/': { status: 200 } },
    });
    const d = await checkHeaders('old.co.il', fetchImpl);
    expect(d.https.ok).toBe(false);
    expect(d.https.error).toBe('Could not connect');
    expect(d.http.redirectsToHttps).toBe(false);
  });

  it('stops after too many redirects', async () => {
    const pages: Record<string, Site> = {};
    for (let i = 0; i < 8; i++) pages[`https://loop.example/${i}`] = { status: 302, headers: { location: `/${i + 1}` } };
    pages['https://loop.example/'] = { status: 302, headers: { location: '/0' } };
    const { fetchImpl } = fakeNet({ dns: { 'loop.example': ['203.0.113.1'] }, pages });
    expect((await checkHeaders('loop.example', fetchImpl)).https.error).toBe('Too many redirects');
  });
});

describe('private address detection', () => {
  it('flags private, loopback, link-local and CGNAT IPv4', () => {
    for (const ip of ['10.1.2.3', '127.0.0.1', '169.254.169.254', '172.16.0.1', '172.31.255.255', '192.168.1.1', '100.64.0.1', '0.0.0.0', '224.0.0.1']) {
      expect(isPrivateIPv4(ip)).toBe(true);
    }
    for (const ip of ['8.8.8.8', '172.32.0.1', '203.0.113.10', '100.128.0.1']) expect(isPrivateIPv4(ip)).toBe(false);
  });

  it('flags private IPv6 and IPv4-mapped private addresses', () => {
    for (const ip of ['::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) expect(isPrivateIPv6(ip)).toBe(true);
    expect(isPrivateIPv6('2606:4700::1111')).toBe(false);
  });
});
