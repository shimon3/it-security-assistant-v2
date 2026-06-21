export const config = { runtime: 'edge' };

const VT_API_BASE = 'https://www.virustotal.com/api/v3';
const CORS_ORIGIN = 'https://it-security-assistant-v2.vercel.app';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  const ip = (body as Record<string, unknown>)?.ip;
  if (typeof ip !== 'string' || ip.trim() === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: ip' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  if (ip.trim().length > 45) {
    return new Response(JSON.stringify({ error: 'Input too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  const trimmedIp = ip.trim();
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmedIp) &&
    trimmedIp.split('.').every((o) => parseInt(o, 10) <= 255);
  const isIPv6 = trimmedIp.includes(':') &&
    /^[0-9a-fA-F:]{2,39}$/.test(trimmedIp) &&
    !/:{3,}/.test(trimmedIp) &&
    trimmedIp.split(':').every((g) => g.length <= 4);
  if (!isIPv4 && !isIPv6) {
    return new Response(JSON.stringify({ error: 'Invalid IP address format' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  try {
    const res = await fetch(`${VT_API_BASE}/ip_addresses/${trimmedIp}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 429) {
      const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Rate limit reached (4 req/min on free tier)' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    if (!res.ok) {
      const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: `API error ${res.status}` };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  } catch {
    const result = { ip, country: null, asOwner: null, asn: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }
}
