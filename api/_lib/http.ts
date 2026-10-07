// Shared helpers for the Edge Functions.
// Files under api/_lib are not exposed as routes by Vercel (underscore prefix).

import { isAuthorized } from './auth';
import { checkRateLimit } from './ratelimit';

export const CORS_ORIGIN = 'https://it-security-assistant-v2.vercel.app';

export function json(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

/** Parses a JSON object body. Returns null when the body is missing or not an object. */
export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Common checks for every route: POST only, valid access token, rate limit.
 * Returns an error Response to send as-is, or null when the request may proceed.
 */
export async function guard(req: Request, routeName: string): Promise<Response | null> {
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' }, { Allow: 'POST' });
  }

  // Rate limit first, so token guessing is throttled too.
  const limit = await checkRateLimit(`${routeName}:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(
      429,
      { error: 'Too many requests — try again in a minute' },
      { 'Retry-After': String(limit.retryAfterSeconds) },
    );
  }

  const auth = isAuthorized(req);
  if (auth === 'misconfigured') {
    return json(500, { error: 'Server misconfigured: ACCESS_TOKEN is not set' });
  }
  if (auth === 'denied') {
    return json(401, { error: 'Unauthorized' }, { 'WWW-Authenticate': 'Bearer' });
  }

  return null;
}
