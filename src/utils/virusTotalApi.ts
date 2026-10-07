import { apiPost, apiErrorOf, errorMessage } from './apiClient';

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

const URL_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_BATCH_URLS = 3;

interface CachedUrlResult {
  expiresAt: number;
  result: VTUrlResult;
}

// Memory-only cache: disappears when the tab/app reloads and never persists client URLs.
const urlCache = new Map<string, CachedUrlResult>();

function normalizeUrlKey(url: string): string {
  return url.trim();
}

function getCachedUrl(url: string): VTUrlResult | null {
  const key = normalizeUrlKey(url);
  const cached = urlCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    urlCache.delete(key);
    return null;
  }
  return cached.result;
}

function cacheUrlResult(result: VTUrlResult): void {
  urlCache.set(normalizeUrlKey(result.url), {
    expiresAt: Date.now() + URL_CACHE_TTL_MS,
    result,
  });
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

const urlError = (url: string, errorMessage: string): VTUrlResult => ({
  url, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0, status: 'error', errorMessage,
});

export async function checkUrlWithVT(url: string): Promise<VTUrlResult> {
  const cached = getCachedUrl(url);
  if (cached) return cached;

  try {
    const res = await apiPost<VTUrlResult>('/api/vt-url', { url });
    if (res.data && 'status' in res.data) {
      cacheUrlResult(res.data);
      return res.data;
    }
    return urlError(url, apiErrorOf(res) ?? `Request failed (${res.status})`);
  } catch (err) {
    return urlError(url, errorMessage(err, 'Network error'));
  }
}

export async function checkHashWithVT(hash: string): Promise<VTFileResult> {
  const fail = (msg: string): VTFileResult => ({
    hash, fileName: null, fileType: null, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, total: 0,
    status: 'error', threatNames: [], errorMessage: msg,
  });
  try {
    const res = await apiPost<VTFileResult>('/api/vt-hash', { hash });
    if (res.data && 'status' in res.data) return res.data;
    return fail(apiErrorOf(res) ?? `Request failed (${res.status})`);
  } catch (err) {
    return fail(errorMessage(err, 'Network error'));
  }
}

export async function scanUrlsWithVT(urls: string[]): Promise<VTUrlResult[]> {
  const unique = [...new Set(urls.map((url) => url.trim()).filter(Boolean))].slice(0, MAX_BATCH_URLS);
  const cachedResults = new Map<string, VTUrlResult>();
  const missing: string[] = [];

  for (const url of unique) {
    const cached = getCachedUrl(url);
    if (cached) cachedResults.set(url, cached);
    else missing.push(url);
  }

  if (missing.length > 0) {
    try {
      const res = await apiPost<VTUrlResult[]>('/api/vt-scan-urls', { urls: missing });
      if (Array.isArray(res.data)) {
        for (const result of res.data) {
          cacheUrlResult(result);
          cachedResults.set(normalizeUrlKey(result.url), result);
        }
      } else {
        const msg = apiErrorOf(res) ?? `Request failed (${res.status})`;
        for (const url of missing) cachedResults.set(url, urlError(url, msg));
      }
    } catch (err) {
      const msg = errorMessage(err, 'Network error');
      for (const url of missing) cachedResults.set(url, urlError(url, msg));
    }
  }

  return unique.map((url) => cachedResults.get(url) ?? urlError(url, 'No result returned'));
}
