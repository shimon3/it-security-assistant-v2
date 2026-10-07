import { guard, json, readJson } from './_lib/http';
import { checkUrl, type VTUrlResult } from './_lib/virustotal';

export const config = { runtime: 'edge' };

const MAX_URLS = 3;

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'vt-scan-urls');
  if (blocked) return blocked;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return json(500, { error: 'Server misconfigured: VIRUSTOTAL_API_KEY is not set' });

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });

  const urls = body.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return json(400, { error: 'Missing or invalid field: urls (must be a non-empty array)' });
  }
  if (urls.length > MAX_URLS) return json(400, { error: `Too many URLs for a single batch (max ${MAX_URLS})` });
  if (urls.some((u) => typeof u !== 'string' || u.trim() === '')) {
    return json(400, { error: 'Invalid field: urls must contain non-empty strings only' });
  }
  const clean = [...new Set((urls as string[]).map((u) => u.trim()))].slice(0, MAX_URLS);
  if (clean.some((u) => u.length > 2048)) return json(400, { error: 'URL too long' });
  if (clean.some((u) => !/^https?:\/\//i.test(u))) {
    return json(400, { error: 'Invalid URL — must start with http:// or https://' });
  }

  const results: VTUrlResult[] = [];
  for (let i = 0; i < clean.length; i++) {
    const { body: result } = await checkUrl(clean[i], apiKey);
    results.push(result);
  }

  // Per-URL errors are reported inside each result; the batch itself succeeded.
  return json(200, results);
}
