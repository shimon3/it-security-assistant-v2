import { describe, expect, it } from 'vitest';
import { countSpfLookups, decodeTxt, type DohResponse } from './dns';
import { auditDomain } from '../domain-audit';

type Zone = Record<string, { A?: boolean; MX?: string[]; TXT?: string[]; AD?: boolean; nx?: boolean }>;

/** Fake DoH resolver answering from an in-memory zone; records every queried name. */
function fakeDns(zone: Zone) {
  const queried: string[] = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const name = url.searchParams.get('name')!;
    const type = url.searchParams.get('type')!;
    queried.push(`${type} ${name}`);
    const z = zone[name];
    const body: DohResponse = { Status: z && !z.nx ? 0 : 3, AD: z?.AD ?? false, Answer: [] };
    if (z && type === 'MX') body.Answer = (z.MX ?? []).map((data) => ({ name, type: 15, TTL: 300, data }));
    if (z && type === 'TXT') body.Answer = (z.TXT ?? []).map((t) => ({ name, type: 16, TTL: 300, data: `"${t}"` }));
    if (z && type === 'A' && z.A) body.Answer = [{ name, type: 1, TTL: 300, data: '192.0.2.1' }];
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;
  return { fetchImpl, queried };
}

describe('decodeTxt', () => {
  it('joins split TXT strings and unescapes quotes', () => {
    expect(decodeTxt('"v=spf1 include:_spf.google.com" " ~all"')).toBe('v=spf1 include:_spf.google.com ~all');
    expect(decodeTxt('"a\\"b"')).toBe('a"b');
    expect(decodeTxt('plain')).toBe('plain');
  });
});

describe('countSpfLookups', () => {
  it('counts include, a, mx, exists and redirect, and follows includes', async () => {
    const { fetchImpl } = fakeDns({
      '_spf.google.com': { TXT: ['v=spf1 include:_netblocks.google.com include:_netblocks2.google.com ~all'] },
      '_netblocks.google.com': { TXT: ['v=spf1 ip4:35.190.247.0/24 ~all'] },
      '_netblocks2.google.com': { TXT: ['v=spf1 ip6:2001:4860:4000::/36 ~all'] },
    });
    // a + mx + include(1 + 2 nested) = 5 ; ip4 does not count
    expect(await countSpfLookups('v=spf1 a mx ip4:192.0.2.1 include:_spf.google.com -all', fetchImpl)).toBe(5);
  });

  it('does not loop on circular includes', async () => {
    const { fetchImpl } = fakeDns({
      'a.test': { TXT: ['v=spf1 include:b.test -all'] },
      'b.test': { TXT: ['v=spf1 include:a.test -all'] },
    });
    expect(await countSpfLookups('v=spf1 include:a.test -all', fetchImpl)).toBeLessThan(10);
  });
});

describe('auditDomain', () => {
  it('collects every record for a well-configured domain', async () => {
    const { fetchImpl } = fakeDns({
      'good.co.il': { A: true, AD: true, MX: ['1 smtp.google.com.'], TXT: ['google-site-verification=x', 'v=spf1 include:_spf.google.com -all'] },
      '_spf.google.com': { TXT: ['v=spf1 ip4:35.190.247.0/24 ~all'] },
      '_dmarc.good.co.il': { TXT: ['v=DMARC1; p=reject; rua=mailto:dmarc@good.co.il'] },
      'google._domainkey.good.co.il': { TXT: ['v=DKIM1; k=rsa; p=MIIBIjANBg'] },
      '_mta-sts.good.co.il': { TXT: ['v=STSv1; id=2026'] },
      '_smtp._tls.good.co.il': { TXT: ['v=TLSRPTv1; rua=mailto:tls@good.co.il'] },
    });
    const d = await auditDomain('good.co.il', fetchImpl);
    expect(d.exists).toBe(true);
    expect(d.dnssec).toBe(true);
    expect(d.mx).toEqual(['1 smtp.google.com']);
    expect(d.spf).toEqual({ records: ['v=spf1 include:_spf.google.com -all'], lookups: 1 });
    expect(d.dmarc.records).toHaveLength(1);
    expect(d.dkim.found).toEqual([{ selector: 'google', record: 'v=DKIM1; k=rsa; p=MIIBIjANBg' }]);
    expect(d.mtaSts).toMatch(/^v=STSv1/);
    expect(d.tlsRpt).toMatch(/^v=TLSRPTv1/);
  });

  it('reports what is missing on a bare domain', async () => {
    const { fetchImpl } = fakeDns({ 'bare.co.il': { A: true } });
    const d = await auditDomain('bare.co.il', fetchImpl);
    expect(d.exists).toBe(true);
    expect(d.mx).toEqual([]);
    expect(d.spf).toEqual({ records: [], lookups: null });
    expect(d.dmarc.records).toEqual([]);
    expect(d.dkim.found).toEqual([]);
    expect(d.mtaSts).toBeNull();
  });

  it('flags a domain that does not exist', async () => {
    const { fetchImpl } = fakeDns({});
    expect((await auditDomain('nope.invalid-tld-test', fetchImpl)).exists).toBe(false);
  });

  it('only queries public DNS names derived from the domain', async () => {
    const { fetchImpl, queried } = fakeDns({ 'x.co.il': { A: true } });
    await auditDomain('x.co.il', fetchImpl);
    expect(queried.every((q) => q.endsWith('x.co.il'))).toBe(true);
  });
});
