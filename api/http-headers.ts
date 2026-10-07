// Reads the HTTP security headers a public website sends: one GET on the home page over HTTPS
// (following up to 5 redirects) and one over plain HTTP to check the redirect to HTTPS.
// Only response headers are kept; the page body is never read or returned.
// Scoring happens in the browser (src/utils/httpHeadersScore.ts).

import { guard, json, readJson } from './_lib/http';
import { normalizeDomain } from './_lib/domain';
import { assertPublicHost, HostError } from './_lib/netguard';
import type { Fetcher } from './_lib/dns';

export const config = { runtime: 'edge' };

export const KEPT_HEADERS = [
  'strict-transport-security',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'server',
  'x-powered-by',
] as const;

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 8000;

export interface Hop {
  url: string;
  status: number;
}

export interface HttpHeadersData {
  domain: string;
  https: { ok: boolean; status: number | null; finalUrl: string | null; chain: Hop[]; headers: Record<string, string>; error?: string };
  http: { redirectsToHttps: boolean | null; status: number | null; location: string | null; error?: string };
  checkedAt: string;
}

function pickHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of KEPT_HEADERS) {
    const v = h.get(name);
    if (v !== null) out[name] = v.slice(0, 2000);
  }
  return out;
}

async function getOnce(url: string, fetchImpl: Fetcher): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      signal: ctrl.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; IT-Security-Assistant/2; security headers check)', accept: 'text/html' },
    });
    // Headers are all we need: release the connection without downloading the page.
    res.body?.cancel().catch(() => {});
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Follows redirects by hand so every hop is checked against private addresses. */
async function follow(startUrl: string, fetchImpl: Fetcher): Promise<{ res: Response; chain: Hop[]; finalUrl: string }> {
  let url = startUrl;
  const chain: Hop[] = [];
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const host = new URL(url).hostname;
    if (!normalizeDomain(host)) throw new HostError('private');
    await assertPublicHost(host, fetchImpl);
    const res = await getOnce(url, fetchImpl);
    chain.push({ url, status: res.status });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, url);
      if (next.protocol !== 'https:' && next.protocol !== 'http:') break;
      url = next.toString();
      continue;
    }
    return { res, chain, finalUrl: url };
  }
  throw new Error('too_many_redirects');
}

function describe(err: unknown): string {
  if (err instanceof HostError) return err.reason === 'private' ? 'Address is not public' : 'Domain has no web server address';
  if (err instanceof Error && err.message === 'too_many_redirects') return 'Too many redirects';
  if (err instanceof Error && err.name === 'AbortError') return 'No answer within 8 seconds';
  return 'Could not connect';
}

export async function checkHeaders(domain: string, fetchImpl: Fetcher = fetch): Promise<HttpHeadersData> {
  const data: HttpHeadersData = {
    domain,
    https: { ok: false, status: null, finalUrl: null, chain: [], headers: {} },
    http: { redirectsToHttps: null, status: null, location: null },
    checkedAt: new Date().toISOString(),
  };

  const [httpsResult, httpResult] = await Promise.allSettled([
    follow(`https://${domain}/`, fetchImpl),
    (async () => {
      await assertPublicHost(domain, fetchImpl);
      return getOnce(`http://${domain}/`, fetchImpl);
    })(),
  ]);

  if (httpsResult.status === 'fulfilled') {
    const { res, chain, finalUrl } = httpsResult.value;
    data.https = { ok: res.status < 400, status: res.status, finalUrl, chain, headers: pickHeaders(res.headers) };
  } else {
    data.https.error = describe(httpsResult.reason);
  }

  if (httpResult.status === 'fulfilled') {
    const res = httpResult.value;
    const location = res.headers.get('location');
    let toHttps = false;
    if (res.status >= 300 && res.status < 400 && location) {
      try {
        toHttps = new URL(location, `http://${domain}/`).protocol === 'https:';
      } catch {
        toHttps = false;
      }
    }
    data.http = { redirectsToHttps: toHttps, status: res.status, location };
  } else {
    data.http.error = describe(httpResult.reason);
  }

  return data;
}

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'http-headers');
  if (blocked) return blocked;

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });
  if (typeof body.domain !== 'string' || !body.domain.trim()) return json(400, { error: 'Missing field: domain' });

  const domain = normalizeDomain(body.domain);
  if (!domain) return json(400, { error: 'Invalid domain format' });

  try {
    return json(200, await checkHeaders(domain));
  } catch {
    return json(502, { error: 'Check failed — try again in a moment' });
  }
}
