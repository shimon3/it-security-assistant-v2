import { guard, json, readJson } from './_lib/http';
import { checkUrl } from './_lib/virustotal';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'vt-url');
  if (blocked) return blocked;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return json(500, { error: 'Server misconfigured: VIRUSTOTAL_API_KEY is not set' });

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) return json(400, { error: 'Missing or invalid field: url' });
  if (url.length > 2048) return json(400, { error: 'Input too long' });
  if (!/^https?:\/\//i.test(url)) return json(400, { error: 'Invalid URL — must start with http:// or https://' });

  const result = await checkUrl(url, apiKey);
  return json(result.httpStatus, result.body);
}
