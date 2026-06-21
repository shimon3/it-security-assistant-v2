export const config = { runtime: 'edge' };

const VT_API_BASE = 'https://www.virustotal.com/api/v3';
const MAX_URLS = 5;

function getUrlId(url: string): string {
  return btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type VTUrlStatus = 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'error';

interface VTUrlResult {
  url: string;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: VTUrlStatus;
  errorMessage?: string;
}

async function checkUrlWithVT(url: string, apiKey: string): Promise<VTUrlResult> {
  const id = getUrlId(url);

  try {
    const res = await fetch(`${VT_API_BASE}/urls/${id}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      const formData = new URLSearchParams();
      formData.append('url', url);
      const submitRes = await fetch(`${VT_API_BASE}/urls`, {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
      if (!submitRes.ok) {
        return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'unknown', errorMessage: 'Submitted for scan' };
      }
      return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'unknown', errorMessage: 'First scan submitted — retry later' };
    }

    if (res.status === 429) {
      return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Rate limit reached (4 req/min on free tier)' };
    }

    if (!res.ok) {
      return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: `API error ${res.status}` };
    }

    const data = await res.json() as { data?: { attributes?: { last_analysis_stats?: Record<string, number> } } };
    const stats = data?.data?.attributes?.last_analysis_stats ?? {};
    const malicious: number = stats.malicious ?? 0;
    const suspicious: number = stats.suspicious ?? 0;
    const harmless: number = stats.harmless ?? 0;
    const undetected: number = stats.undetected ?? 0;
    const total = malicious + suspicious + harmless + undetected;

    let status: VTUrlStatus = 'clean';
    if (malicious > 0) status = 'malicious';
    else if (suspicious > 0) status = 'suspicious';

    return { url, malicious, suspicious, harmless, undetected, total, status };
  } catch {
    return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration: API key not set' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const urls = (body as Record<string, unknown>)?.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: urls (must be a non-empty array)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urls.some((u) => typeof u !== 'string' || u.trim() === '')) {
    return new Response(JSON.stringify({ error: 'Invalid field: urls must contain non-empty strings only' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (urls.length > MAX_URLS) {
    return new Response(JSON.stringify({ error: `Too many URLs for a single batch (max ${MAX_URLS})` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results: VTUrlResult[] = [];
  for (let i = 0; i < urls.length; i++) {
    const result = await checkUrlWithVT(urls[i] as string, apiKey);
    results.push(result);
    // Respect free tier: 4 req/min — wait 250ms between calls (skip after last)
    if (i < urls.length - 1) {
      await sleep(250);
    }
  }

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
