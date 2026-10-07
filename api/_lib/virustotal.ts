// VirusTotal v3 lookups shared by the vt-* routes.
// Note: the free public API forbids commercial use. These routes are for personal use only
// and are hidden in "audit mode" (see src/utils/auditMode.ts).

export const VT_API_BASE = 'https://www.virustotal.com/api/v3';

export type VTUrlStatus = 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'error';

export interface VTUrlResult {
  url: string;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: VTUrlStatus;
  errorMessage?: string;
}

export interface RouteResult<T> {
  httpStatus: number;
  body: T;
}

export function urlId(url: string): string {
  // VT expects unpadded base64url of the raw URL. btoa needs latin-1, so encode UTF-8 first.
  const bytes = new TextEncoder().encode(url);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function statsToStatus(stats: Record<string, number>): {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  verdict: 'clean' | 'suspicious' | 'malicious';
} {
  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;
  const harmless = stats.harmless ?? 0;
  const undetected = stats.undetected ?? 0;
  const verdict = malicious > 0 ? 'malicious' : suspicious > 0 ? 'suspicious' : 'clean';
  return { malicious, suspicious, harmless, undetected, total: malicious + suspicious + harmless + undetected, verdict };
}

const emptyUrl = (url: string, status: VTUrlStatus, errorMessage: string): VTUrlResult => ({
  url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status, errorMessage,
});

export async function checkUrl(url: string, apiKey: string): Promise<RouteResult<VTUrlResult>> {
  try {
    const res = await fetch(`${VT_API_BASE}/urls/${urlId(url)}`, { headers: { 'x-apikey': apiKey } });

    if (res.status === 404) {
      // Do not auto-submit unknown URLs. A public-API lookup must stay cheap and predictable:
      // one user action = at most one VirusTotal request per URL.
      return { httpStatus: 200, body: emptyUrl(url, 'unknown', 'Not in VirusTotal database') };
    }
    if (res.status === 429) {
      return { httpStatus: 429, body: emptyUrl(url, 'error', 'VirusTotal rate limit reached (4 req/min on free tier)') };
    }
    if (!res.ok) {
      return { httpStatus: 502, body: emptyUrl(url, 'error', `VirusTotal error ${res.status}`) };
    }

    const data = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: Record<string, number> } } };
    const s = statsToStatus(data?.data?.attributes?.last_analysis_stats ?? {});
    return {
      httpStatus: 200,
      body: { url, malicious: s.malicious, suspicious: s.suspicious, harmless: s.harmless, undetected: s.undetected, total: s.total, status: s.verdict },
    };
  } catch {
    return { httpStatus: 502, body: emptyUrl(url, 'error', 'Could not reach VirusTotal') };
  }
}
