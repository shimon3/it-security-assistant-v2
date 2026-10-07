import { describe, expect, it, vi } from 'vitest';
import { checkPwnedPassword, countInRange, sha1Hex } from './pwnedPasswords';

// SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const PREFIX = '5BAA6';
const SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8';

describe('pwnedPasswords', () => {
  it('computes an uppercase SHA-1', async () => {
    expect(await sha1Hex('password')).toBe(PREFIX + SUFFIX);
  });

  it('finds the count in a range body and ignores padding lines', () => {
    const body = `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n${SUFFIX}:9545824\r\nFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF:0`;
    expect(countInRange(body, SUFFIX)).toBe(9545824);
    expect(countInRange(body, 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toBe(0);
    expect(countInRange(body, 'ABC')).toBe(0);
  });

  it('sends only the 5-character prefix, never the password or full hash', async () => {
    const fetchMock = vi.fn(async () => new Response(`${SUFFIX}:42\n`, { status: 200 }));
    const r = await checkPwnedPassword('password', fetchMock as unknown as typeof fetch);
    expect(r).toEqual({ pwned: true, count: 42 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${PREFIX}`);
    expect(url).not.toContain(SUFFIX);
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)['Add-Padding']).toBe('true');
  });

  it('reports a password absent from breaches', async () => {
    const fetchMock = vi.fn(async () => new Response('0018A45C4D1DEF81644B54AB7F969B88D65:1\n', { status: 200 }));
    expect(await checkPwnedPassword('password', fetchMock as unknown as typeof fetch)).toEqual({ pwned: false, count: 0 });
  });

  it('throws a readable error on rate limit', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 429 }));
    await expect(checkPwnedPassword('x', fetchMock as unknown as typeof fetch)).rejects.toThrow(/Service busy/);
  });
});
