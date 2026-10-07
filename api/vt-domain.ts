import { guard, json, readJson } from './_lib/http';
import { normalizeDomain } from './_lib/domain';
import { VT_API_BASE, statsToStatus } from './_lib/virustotal';

export const config = { runtime: 'edge' };

const empty = (domain: string, errorMessage: string) => ({
  domain, registrar: null, creationDate: null, categories: [] as string[],
  malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error' as const, errorMessage,
});

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'vt-domain');
  if (blocked) return blocked;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return json(500, { error: 'Server misconfigured: VIRUSTOTAL_API_KEY is not set' });

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });
  if (typeof body.domain !== 'string' || !body.domain.trim()) {
    return json(400, { error: 'Missing or invalid field: domain' });
  }

  const domain = normalizeDomain(body.domain);
  if (!domain) return json(400, { error: 'Invalid domain format' });

  try {
    const res = await fetch(`${VT_API_BASE}/domains/${encodeURIComponent(domain)}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 404) return json(404, empty(domain, 'Domain not found'));
    if (res.status === 429) return json(429, empty(domain, 'VirusTotal rate limit reached (4 req/min on free tier)'));
    if (!res.ok) return json(502, empty(domain, `VirusTotal error ${res.status}`));

    const data = (await res.json()) as {
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
    const s = statsToStatus(attrs.last_analysis_stats ?? {});

    return json(200, {
      domain,
      registrar: attrs.registrar ?? null,
      creationDate: attrs.creation_date ?? null,
      categories: [...new Set(Object.values(attrs.categories ?? {}))],
      malicious: s.malicious,
      suspicious: s.suspicious,
      harmless: s.harmless,
      undetected: s.undetected,
      total: s.total,
      status: s.verdict,
    });
  } catch {
    return json(502, empty(domain, 'Could not reach VirusTotal'));
  }
}
