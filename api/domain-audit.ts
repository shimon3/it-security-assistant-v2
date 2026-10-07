// Email-security audit of a domain from public DNS: MX, SPF, DMARC, DKIM (common selectors),
// DNSSEC, MTA-STS and TLS-RPT. Read-only public data: no authorisation from the domain owner needed.
// Scoring happens in the browser (src/utils/domainScore.ts) so the rules are testable and visible.

import { guard, json, readJson } from './_lib/http';
import { normalizeDomain } from './_lib/domain';
import { countSpfLookups, dohQuery, RR, txtRecords, type Fetcher } from './_lib/dns';

export const config = { runtime: 'edge' };

/** Selectors used by the providers most common in Israeli SMBs (Google, Microsoft 365, Mailchimp, cPanel hosts…). */
export const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'default', 'k1', 'k2', 's1', 's2', 'mail', 'dkim'];

export interface DomainAuditData {
  domain: string;
  exists: boolean;
  dnssec: boolean;
  mx: string[];
  spf: { records: string[]; lookups: number | null };
  dmarc: { records: string[] };
  dkim: { found: { selector: string; record: string }[]; checked: string[] };
  mtaSts: string | null;
  tlsRpt: string | null;
  checkedAt: string;
}

export async function auditDomain(domain: string, fetchImpl: Fetcher = fetch): Promise<DomainAuditData> {
  const safeTxt = (name: string) => txtRecords(name, fetchImpl).catch(() => [] as string[]);

  const [base, mxRes, rootTxt, dmarcTxt, mtaStsTxt, tlsRptTxt, ...dkimTxt] = await Promise.all([
    dohQuery(domain, 'A', fetchImpl),
    dohQuery(domain, 'MX', fetchImpl).catch(() => ({ Status: 2 }) as Awaited<ReturnType<typeof dohQuery>>),
    safeTxt(domain),
    safeTxt(`_dmarc.${domain}`),
    safeTxt(`_mta-sts.${domain}`),
    safeTxt(`_smtp._tls.${domain}`),
    ...DKIM_SELECTORS.map((s) => safeTxt(`${s}._domainkey.${domain}`)),
  ]);

  const mx = (mxRes.Answer ?? [])
    .filter((a) => a.type === RR.MX)
    .map((a) => a.data.replace(/\.$/, ''))
    .sort((a, b) => Number(a.split(' ')[0]) - Number(b.split(' ')[0]));

  const spfRecords = rootTxt.filter((t) => /^v=spf1(\s|$)/i.test(t));
  const lookups = spfRecords.length === 1 ? await countSpfLookups(spfRecords[0], fetchImpl) : null;

  return {
    domain,
    exists: base.Status !== 3 || mx.length > 0 || rootTxt.length > 0,
    dnssec: base.AD === true,
    mx,
    spf: { records: spfRecords, lookups },
    dmarc: { records: dmarcTxt.filter((t) => /^v=DMARC1(\s*;|$)/i.test(t)) },
    dkim: {
      found: DKIM_SELECTORS.flatMap((selector, i) =>
        dkimTxt[i].filter((t) => /(^|;)\s*(v=DKIM1|k=|p=)/i.test(t)).slice(0, 1).map((record) => ({ selector, record })),
      ),
      checked: DKIM_SELECTORS,
    },
    mtaSts: mtaStsTxt.find((t) => /^v=STSv1/i.test(t)) ?? null,
    tlsRpt: tlsRptTxt.find((t) => /^v=TLSRPTv1/i.test(t)) ?? null,
    checkedAt: new Date().toISOString(),
  };
}

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'domain-audit');
  if (blocked) return blocked;

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });
  if (typeof body.domain !== 'string' || !body.domain.trim()) return json(400, { error: 'Missing field: domain' });

  const domain = normalizeDomain(body.domain);
  if (!domain) return json(400, { error: 'Invalid domain format' });

  try {
    return json(200, await auditDomain(domain));
  } catch {
    return json(502, { error: 'DNS lookup failed — try again in a moment' });
  }
}
