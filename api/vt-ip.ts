export const config = { runtime: 'edge' };

const VT_API_BASE = 'https://www.virustotal.com/api/v3';

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

  const ip = (body as Record<string, unknown>)?.ip;
  if (typeof ip !== 'string' || ip.trim() === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: ip' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${VT_API_BASE}/ip_addresses/${ip.trim()}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 429) {
      const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Rate limit reached (4 req/min on free tier)' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!res.ok) {
      const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: `API error ${res.status}` };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json() as {
      data?: {
        attributes?: {
          country?: string;
          as_owner?: string;
          asn?: number;
          last_analysis_stats?: Record<string, number>;
        };
      };
    };

    const attrs = data?.data?.attributes ?? {};
    const stats = attrs.last_analysis_stats ?? {};

    const malicious: number = stats.malicious ?? 0;
    const suspicious: number = stats.suspicious ?? 0;
    const harmless: number = stats.harmless ?? 0;
    const undetected: number = stats.undetected ?? 0;
    const total = malicious + suspicious + harmless + undetected;

    let status: 'clean' | 'suspicious' | 'malicious' | 'error' = 'clean';
    if (malicious > 0) status = 'malicious';
    else if (suspicious > 0) status = 'suspicious';

    const result = {
      ip,
      country: attrs.country ?? null,
      asOwner: attrs.as_owner ?? null,
      asn: attrs.asn ?? null,
      malicious,
      suspicious,
      harmless,
      undetected,
      total,
      status,
    };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
