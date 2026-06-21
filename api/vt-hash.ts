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

  const hash = (body as Record<string, unknown>)?.hash;
  if (typeof hash !== 'string' || hash.trim() === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: hash' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  const cleanHash = hash.trim();
  if (!/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(cleanHash)) {
    return new Response(JSON.stringify({ error: 'Invalid hash — must be MD5 (32), SHA-1 (40) or SHA-256 (64) hex' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  try {
    const res = await fetch(`${VT_API_BASE}/files/${cleanHash}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      const result = { hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'not_found', threatNames: [], errorMessage: 'Hash not found in VirusTotal database' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    if (res.status === 429) {
      const result = { hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', threatNames: [], errorMessage: 'Rate limit reached (4 req/min on free tier)' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    if (!res.ok) {
      const result = { hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', threatNames: [], errorMessage: `API error ${res.status}` };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    const data = await res.json() as {
      data?: {
        attributes?: {
          last_analysis_stats?: Record<string, number>;
          last_analysis_results?: Record<string, { category: string; result: string }>;
          meaningful_name?: string;
          names?: string[];
          type_description?: string;
          type_tag?: string;
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

    const engines: Record<string, { category: string; result: string }> = attrs.last_analysis_results ?? {};
    const threatNames = [...new Set(
      Object.values(engines)
        .filter((e) => e.category === 'malicious' && e.result)
        .map((e) => e.result)
    )].slice(0, 5);

    let status: 'clean' | 'suspicious' | 'malicious' | 'not_found' | 'error' = 'clean';
    if (malicious > 0) status = 'malicious';
    else if (suspicious > 0) status = 'suspicious';

    const result = {
      hash,
      fileName: attrs.meaningful_name ?? attrs.names?.[0] ?? null,
      fileType: attrs.type_description ?? attrs.type_tag ?? null,
      malicious,
      suspicious,
      harmless,
      undetected,
      total,
      status,
      threatNames,
    };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  } catch {
    const result = { hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', threatNames: [], errorMessage: 'Network error' };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }
}
