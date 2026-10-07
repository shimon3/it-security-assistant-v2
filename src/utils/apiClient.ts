// Calls to the app's own /api routes, with the personal access token.
// The token is typed by the user and kept in sessionStorage only (cleared when the tab closes).
// In demo mode, calls are answered locally with made-up data (src/utils/demoMode.ts).

import { demoResponse, isDemoMode } from './demoMode';

const TOKEN_KEY = 'itsa_access_token';
export const AUTH_REQUIRED_EVENT = 'itsa-auth-required';

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token.trim());
  } catch {
    // Storage unavailable (private mode): the token simply won't persist.
  }
}

export function clearToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  /** Parsed body, or null if the body was not JSON. */
  data: (T & { error?: string }) | null;
}

export class AuthRequiredError extends Error {
  constructor() {
    super('Access token required');
    this.name = 'AuthRequiredError';
  }
}

/**
 * POSTs JSON to an /api route. Never throws on HTTP errors: routes return a result body
 * even for 429/502, so callers can still show it. Throws AuthRequiredError on 401
 * (after asking the app to show the token prompt) and Error on network failure.
 */
export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  if (isDemoMode()) {
    // Short pause so the demo feels like a real check.
    await new Promise((r) => setTimeout(r, 450));
    const fake = demoResponse(path, body);
    return fake === null
      ? { ok: false, status: 503, data: { error: 'Not available in the demo. Exit the demo to use this tool.' } as ApiResponse<T>['data'] }
      : { ok: true, status: 200, data: fake as ApiResponse<T>['data'] };
  }

  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  if (!token) {
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
    throw new AuthRequiredError();
  }

  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
    throw new AuthRequiredError();
  }

  let data: ApiResponse<T>['data'] = null;
  try {
    data = (await res.json()) as ApiResponse<T>['data'];
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

/** Human-readable message for a failed call. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof AuthRequiredError) return 'Access token required — enter it to use this tool.';
  return fallback;
}

/** The `error` field of a failed call's body, if any. */
export function apiErrorOf(res: ApiResponse<unknown>): string | undefined {
  const d = res.data as { error?: unknown } | null;
  return typeof d?.error === 'string' ? d.error : undefined;
}
