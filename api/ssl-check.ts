import { guard, json, readJson } from './_lib/http';
import { normalizeDomain } from './_lib/domain';

export const config = { runtime: 'edge' };

// Qualys SSL Labs: commercial use is not allowed without Qualys' permission.
// Personal use only — this tool is hidden in audit mode.

interface SslResult {
  domain: string;
  status: 'valid' | 'expiring' | 'invalid' | 'pending' | 'error';
  grade: string | null;
  expiryDate: number | null;
  daysRemaining: number | null;
  issuer: string | null;
  errorMessage?: string;
}

const respond = json;

export default async function handler(req: Request): Promise<Response> {
  const blocked = await guard(req, 'ssl-check');
  if (blocked) return blocked;

  const body = await readJson(req);
  if (!body) return respond(400, { error: 'Invalid JSON body' });

  const raw = body.domain;
  if (typeof raw !== 'string' || !raw.trim()) {
    return respond(400, { error: 'Missing field: domain' });
  }

  const domain = normalizeDomain(raw);
  if (!domain) return respond(400, { error: 'Invalid domain format' });

  try {
    const res = await fetch(
      `https://api.ssllabs.com/api/v3/analyze?host=${encodeURIComponent(domain)}&fromCache=on&maxAge=24`,
      { headers: { 'User-Agent': 'IT-Security-Assistant/1.0' } },
    );

    if (res.status === 429) {
      const result: SslResult = {
        domain, status: 'error', grade: null, expiryDate: null, daysRemaining: null, issuer: null,
        errorMessage: 'Too many requests — try again in a moment',
      };
      return respond(429, result);
    }

    if (!res.ok) {
      const result: SslResult = {
        domain, status: 'error', grade: null, expiryDate: null, daysRemaining: null, issuer: null,
        errorMessage: 'Analysis unavailable — try again later',
      };
      return respond(502, result);
    }

    const data = await res.json() as {
      status: string;
      endpoints?: Array<{ grade?: string }>;
      certs?: Array<{ notAfter?: number; issuerLabel?: string }>;
    };

    if (data.status !== 'READY') {
      const result: SslResult = {
        domain, status: 'pending', grade: null, expiryDate: null, daysRemaining: null, issuer: null,
        errorMessage: 'Analysis in progress — retry in 60 seconds',
      };
      return respond(200, result);
    }

    const grade = data.endpoints?.[0]?.grade ?? null;
    const cert = data.certs?.[0];
    const rawTs = cert?.notAfter ?? null;
    // SSL Labs returns notAfter in milliseconds
    const expiryMs = rawTs ? (rawTs > 1e12 ? rawTs : rawTs * 1000) : null;
    const daysRemaining = expiryMs !== null
      ? Math.floor((expiryMs - Date.now()) / 86_400_000)
      : null;
    const issuer = cert?.issuerLabel ?? null;

    let status: SslResult['status'] = 'valid';
    if (grade === 'T' || grade === 'M' || grade === 'F' || (daysRemaining !== null && daysRemaining <= 0)) {
      status = 'invalid';
    } else if (daysRemaining !== null && daysRemaining <= 30) {
      status = 'expiring';
    }

    const result: SslResult = { domain, status, grade, expiryDate: expiryMs, daysRemaining, issuer };
    return respond(200, result);
  } catch {
    const result: SslResult = {
      domain, status: 'error', grade: null, expiryDate: null, daysRemaining: null, issuer: null,
      errorMessage: 'Could not reach SSL Labs',
    };
    return respond(502, result);
  }
}
