import { guard, json, readJson } from './_lib/http';
import { VT_API_BASE, statsToStatus } from './_lib/virustotal';

export const config = { runtime: 'edge' };

export function isValidIp(ip: string): boolean {
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && ip.split('.').every((o) => Number(o) <= 255);
  const isIPv6 =
    ip.includes(':') &&
    /^[0-9a-fA-F:]{2,39}$/.test(ip) &&
    !/:{3,}/.test(ip) &&
    ip.split(':').every((g) => g.length <= 4);
  return isIPv4 || isIPv6;
}

const empty = (ip: string, errorMessage: string) => ({
  ip, country: null, asOwner: null, asn: null,
  malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error' as const, errorMessage,
});

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'vt-ip');
  if (blocked) return blocked;

  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return json(500, { error: 'Server misconfigured: VIRUSTOTAL_API_KEY is not set' });

  const body = await readJson(req);
  if (!body) return json(400, { error: 'Invalid JSON body' });

  const ip = typeof body.ip === 'string' ? body.ip.trim() : '';
  if (!ip) return json(400, { error: 'Missing or invalid field: ip' });
  if (ip.length > 45) return json(400, { error: 'Input too long' });
  if (!isValidIp(ip)) return json(400, { error: 'Invalid IP address format' });

  try {
    const res = await fetch(`${VT_API_BASE}/ip_addresses/${encodeURIComponent(ip)}`, {
      headers: { 'x-apikey': apiKey },
    });

    if (res.status === 429) return json(429, empty(ip, 'VirusTotal rate limit reached (4 req/min on free tier)'));
    if (!res.ok) return json(502, empty(ip, `VirusTotal error ${res.status}`));

    const data = (await res.json()) as {
      data?: { attributes?: { country?: string; as_owner?: string; asn?: number; last_analysis_stats?: Record<string, number> } };
    };
    const attrs = data?.data?.attributes ?? {};
    const s = statsToStatus(attrs.last_analysis_stats ?? {});

    return json(200, {
      ip,
      country: attrs.country ?? null,
      asOwner: attrs.as_owner ?? null,
      asn: attrs.asn ?? null,
      malicious: s.malicious,
      suspicious: s.suspicious,
      harmless: s.harmless,
      undetected: s.undetected,
      total: s.total,
      status: s.verdict,
    });
  } catch {
    return json(502, empty(ip, 'Could not reach VirusTotal'));
  }
}
