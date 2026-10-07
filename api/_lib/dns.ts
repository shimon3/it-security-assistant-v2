// DNS lookups over HTTPS (Cloudflare public resolver, JSON API), usable from Edge Functions.

export const DOH_URL = 'https://cloudflare-dns.com/dns-query';

export const RR = { A: 1, CNAME: 5, MX: 15, TXT: 16 } as const;

export interface DohAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DohResponse {
  /** 0 = NOERROR, 3 = NXDOMAIN */
  Status: number;
  /** Authenticated Data: the answer was DNSSEC-validated. */
  AD?: boolean;
  Answer?: DohAnswer[];
}

export type Fetcher = typeof fetch;

export async function dohQuery(name: string, type: keyof typeof RR, fetchImpl: Fetcher = fetch): Promise<DohResponse> {
  const url = `${DOH_URL}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetchImpl(url, { headers: { accept: 'application/dns-json' } });
  if (!res.ok) throw new Error(`DNS query failed (${res.status})`);
  return (await res.json()) as DohResponse;
}

/** TXT data comes quoted and may be split in 255-byte chunks: "v=spf1 ..." "... ~all" */
export function decodeTxt(data: string): string {
  const parts = data.match(/"((?:[^"\\]|\\.)*)"/g);
  if (!parts) return data.trim();
  return parts.map((p) => p.slice(1, -1).replace(/\\(.)/g, '$1')).join('');
}

export async function txtRecords(name: string, fetchImpl: Fetcher = fetch): Promise<string[]> {
  const r = await dohQuery(name, 'TXT', fetchImpl);
  return (r.Answer ?? []).filter((a) => a.type === RR.TXT).map((a) => decodeTxt(a.data));
}

export const DNS_LOOKUP_MECHANISMS = /^[+\-~?]?(include:|a$|a:|a\/|mx$|mx:|mx\/|ptr$|ptr:|exists:)|^redirect=/i;

/**
 * Counts the DNS lookups an SPF record triggers, following include: and redirect= (RFC 7208 §4.6.4:
 * more than 10 makes SPF fail with "permerror"). Stops after `maxQueries` fetches.
 */
export async function countSpfLookups(
  record: string,
  fetchImpl: Fetcher = fetch,
  state: { queries: number; seen: Set<string> } = { queries: 0, seen: new Set() },
  maxQueries = 15,
): Promise<number> {
  let count = 0;
  for (const term of record.split(/\s+/).slice(1)) {
    if (!DNS_LOOKUP_MECHANISMS.test(term)) continue;
    count += 1;

    const target = /^[+\-~?]?include:(.+)$/i.exec(term)?.[1] ?? /^redirect=(.+)$/i.exec(term)?.[1];
    if (!target || state.seen.has(target) || state.queries >= maxQueries) continue;
    state.seen.add(target);
    state.queries += 1;

    try {
      const spf = (await txtRecords(target, fetchImpl)).find((t) => /^v=spf1(\s|$)/i.test(t));
      if (spf) count += await countSpfLookups(spf, fetchImpl, state, maxQueries);
    } catch {
      // An unreachable include is reported by the count staying low; not fatal for the audit.
    }
  }
  return count;
}
