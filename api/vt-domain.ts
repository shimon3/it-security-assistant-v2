export const config = { runtime: 'edge' };

const VT_API_BASE = 'https://www.virustotal.com/api/v3';

function extractHostname(input: string): string {
  let s = input.trim();
  s = s.replace(/^https?:\/\//i, '');
  s = s.replace(/\/.*$/, '');
  return s.toLowerCase();
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

  const raw = (body as Record<string, unknown>)?.domain;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: domain' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const domain = extractHostname(raw);

  try {
    const res = await fetch(`${VT_API_BASE}/domains/${domain}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) {
      const result = { domain, registrar: null, creationDate: null, categories: [], malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Domain not found' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (res.status === 429) {
      const result = { domain, registrar: null, creationDate: null, categories: [], malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Rate limit reached (4 req/min on free tier)' };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!res.ok) {
      const result = { domain, registrar: null, creationDate: null, categories: [], malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: `API error ${res.status}` };
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json() as {
      data?: {
        attributes?: {
          registrar?: string;
          creation_date?: number;
          categories?: Record<string, string>;
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

    const categories = [...new Set(Object.values(attrs.categories ?? {}))];

    let status: 'clean' | 'suspicious' | 'malicious' | 'error' = 'clean';
    if (malicious > 0) status = 'malicious';
    else if (suspicious > 0) status = 'suspicious';

    const result = {
      domain,
      registrar: attrs.registrar ?? null,
      creationDate: attrs.creation_date ?? null,
      categories,
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
    const result = { domain, registrar: null, creationDate: null, categories: [], malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
