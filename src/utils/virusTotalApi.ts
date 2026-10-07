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
  try {
    const res = await apiPost<VTUrlResult>('/api/vt-url', { url });
    if (res.data && 'status' in res.data) return res.data;
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
  try {
    const res = await apiPost<VTUrlResult[]>('/api/vt-scan-urls', { urls });
    if (Array.isArray(res.data)) return res.data;
    const msg = apiErrorOf(res) ?? `Request failed (${res.status})`;
    return urls.map((url) => urlError(url, msg));
  } catch (err) {
    return urls.map((url) => urlError(url, errorMessage(err, 'Network error')));
  }
}
