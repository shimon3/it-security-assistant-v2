export interface VTUrlResult {
  url: string;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: 'clean' | 'suspicious' | 'malicious' | 'unknown' | 'error';
  errorMessage?: string;
}

export interface VTFileResult {
  hash: string;
  fileName: string | null;
  fileType: string | null;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  status: 'clean' | 'suspicious' | 'malicious' | 'not_found' | 'error';
  threatNames: string[];
  errorMessage?: string;
}

export async function checkUrlWithVT(url: string): Promise<VTUrlResult> {
  try {
    const res = await fetch('/api/vt-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return await res.json() as VTUrlResult;
  } catch {
    return { url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage: 'Network error' };
  }
}

export async function checkHashWithVT(hash: string): Promise<VTFileResult> {
  try {
    const res = await fetch('/api/vt-hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash }),
    });
    return await res.json() as VTFileResult;
  } catch {
    return { hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', threatNames: [], errorMessage: 'Network error' };
  }
}

export async function scanUrlsWithVT(urls: string[]): Promise<VTUrlResult[]> {
  try {
    const res = await fetch('/api/vt-scan-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    return await res.json() as VTUrlResult[];
  } catch {
    return urls.map((url) => ({
      url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error' as const, errorMessage: 'Network error',
    }));
  }
}
