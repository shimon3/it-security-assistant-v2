// Refuses to fetch hosts that resolve to private, loopback or link-local addresses,
// so the http-headers route cannot be used to probe internal networks (SSRF).
// Resolution goes through public DNS-over-HTTPS; the platform's own resolver could still
// differ (DNS rebinding), which is acceptable for a read-only GET with no body returned.

import { dohQuery, type Fetcher } from './dns';

export function isPrivateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) ||           // link-local, cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224                              // multicast and reserved
  );
}

export function isPrivateIPv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === '::' || v === '::1') return true;
  if (v.startsWith('::ffff:')) return isPrivateIPv4(v.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v);
}

/** Resolves A and AAAA records and checks every address is public. */
export async function assertPublicHost(host: string, fetchImpl: Fetcher = fetch): Promise<void> {
  const [a, aaaa] = await Promise.all([
    dohQuery(host, 'A', fetchImpl),
    dohQuery(host, 'AAAA', fetchImpl).catch(() => ({ Status: 0, Answer: [] })),
  ]);
  const v4 = (a.Answer ?? []).filter((r) => r.type === 1).map((r) => r.data);
  const v6 = (aaaa.Answer ?? []).filter((r) => r.type === 28).map((r) => r.data);
  if (v4.length + v6.length === 0) throw new HostError('not_found');
  if (v4.some(isPrivateIPv4) || v6.some(isPrivateIPv6)) throw new HostError('private');
}

export class HostError extends Error {
  constructor(public reason: 'not_found' | 'private') {
    super(reason);
    this.name = 'HostError';
  }
}
