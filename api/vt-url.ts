export const config = { runtime: 'edge' };

const VT_API_BASE = 'https://www.virustotal.com/api/v3';

function getUrlId(url: string): string {
  return btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
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

  const url = (body as Record<string, unknown>)?.url;
  if (typeof url !== 'string' || url.trim() === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const id = getUrlId(url);

  try {
    const res = await fetch(`${VT_API_BASE}/urls/${id}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      // URL not in VT database yet — submit it for scanning
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
        const result = { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'unknown', errorMessage: 'Submitted for scan' };
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const result = { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'unknown', errorMessage: 'First scan submitted — retry later' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (res.status === 429) {
      const result = { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Rate limit reached (4 req/min on free tier)' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!res.ok) {
      const result = { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: `API error ${res.status}` };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json() as { data?: { attributes?: { last_analysis_stats?: Record<string, number> } } };
    const stats = data?.data?.attributes?.last_analysis_stats ?? {};
    const malicious: number = stats.malicious ?? 0;
    const suspicious: number = stats.suspicious ?? 0;
    const harmless: number = stats.harmless ?? 0;
    const undetected: number = stats.undetected ?? 0;
    const total = malicious + suspicious + harmless + undetected;

    let status: 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'error' = 'clean';
    if (malicious > 0) status = 'malicious';
    else if (suspicious > 0) status = 'suspicious';

    const result = { url, malicious, suspicious, harmless, undetected, total, status };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    const result = { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
