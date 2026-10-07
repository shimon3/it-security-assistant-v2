import { guard, json, readJson } from './_lib/http';
import { VT_API_BASE, statsToStatus } from './_lib/virustotal';

export const config = { runtime: 'edge' };

type HashStatus = 'clean' | 'suspicious' | 'malicious' | 'not_found' | 'error';

const empty = (hash: string, status: HashStatus, errorMessage: string) => ({
  hash, fileName: null, fileType: null,
  malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status, threatNames: [] as string[], errorMessage,
});

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'vt-hash');
  if (blocked) return blocked;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return json(500, { error: 'Server misconfigured: VIRUSTOTAL_API_KEY is not set' });

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });

  const hash = typeof body.hash === 'string' ? body.hash.trim() : '';
  if (!hash) return json(400, { error: 'Missing or invalid field: hash' });
  if (!/^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$/.test(hash)) {
    return json(400, { error: 'Invalid hash — must be MD5 (32), SHA-1 (40) or SHA-256 (64) hex' });
  }

  try {
    const res = await fetch(`${VT_API_BASE}/files/${hash}`, { headers: { 'x-apikey': apiKey } });

    // "Not found" is a normal answer for an unknown file, not a failure.
    if (res.status === 404) return json(200, empty(hash, 'not_found', 'Hash not found in VirusTotal database'));
    if (res.status === 429) return json(429, empty(hash, 'error', 'VirusTotal rate limit reached (4 req/min on free tier)'));
    if (!res.ok) return json(502, empty(hash, 'error', `VirusTotal error ${res.status}`));

    const data = (await res.json()) as {
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
    const s = statsToStatus(attrs.last_analysis_stats ?? {});
    const threatNames = [
      ...new Set(
        Object.values(attrs.last_analysis_results ?? {})
          .filter((e) => e.category === 'malicious' && e.result)
          .map((e) => e.result),
      ),
    ].slice(0, 5);

    return json(200, {
      hash,
      fileName: attrs.meaningful_name ?? attrs.names?.[0] ?? null,
      fileType: attrs.type_description ?? attrs.type_tag ?? null,
      malicious: s.malicious,
      suspicious: s.suspicious,
      harmless: s.harmless,
      undetected: s.undetected,
      total: s.total,
      status: s.verdict,
      threatNames,
    });
  } catch {
    return json(502, empty(hash, 'error', 'Could not reach VirusTotal'));
  }
}
