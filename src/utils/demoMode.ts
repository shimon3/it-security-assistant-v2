// Demo mode: every online check answers with made-up data for a fictional shop, without
// calling the server or needing the access token. Used to show the tool to a prospect.
// The flag lives in memory only, so a reload always returns to real mode.

import { useSyncExternalStore } from 'react';
import type { DomainAuditData } from './domainScore';
import type { HttpHeadersData } from './httpHeadersScore';

export const DEMO_DOMAIN = 'example-shop.co.il';

let on = false;
const listeners = new Set<() => void>();

export function isDemoMode(): boolean {
  return on;
}

export function setDemoMode(value: boolean): void {
  on = value;
  listeners.forEach((l) => l());
}

export function useDemoMode(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    isDemoMode,
    isDemoMode,
  );
}

const now = () => new Date().toISOString();

export function demoDomainAudit(domain: string): DomainAuditData {
  return {
    domain,
    exists: true,
    dnssec: false,
    mx: ['10 mail.' + domain],
    spf: { records: ['v=spf1 a mx include:spf.protection.outlook.com ?all'], lookups: 4 },
    dmarc: { records: ['v=DMARC1; p=none'] },
    dkim: { found: [], checked: ['google', 'selector1', 'selector2', 'default'] },
    mtaSts: null,
    tlsRpt: null,
    checkedAt: now(),
  };
}

export function demoHttpHeaders(domain: string): HttpHeadersData {
  return {
    domain,
    https: {
      ok: true,
      status: 200,
      finalUrl: `https://www.${domain}/`,
      chain: [
        { url: `https://${domain}/`, status: 301 },
        { url: `https://www.${domain}/`, status: 200 },
      ],
      headers: { server: 'Apache/2.4.41 (Ubuntu)', 'x-powered-by': 'PHP/7.4.3' },
    },
    http: { redirectsToHttps: false, status: 200, location: null },
    checkedAt: now(),
  };
}

function demoVtUrl(url: string) {
  return { url, malicious: 7, suspicious: 2, harmless: 51, undetected: 9, total: 69, status: 'malicious' };
}

/** Fake answer for an /api route, or null when the route has no demo data. */
export function demoResponse(path: string, body: unknown): unknown | null {
  const b = (body ?? {}) as Record<string, unknown>;
  const domain = typeof b.domain === 'string' && b.domain.trim() ? b.domain.trim().toLowerCase() : DEMO_DOMAIN;
  switch (path) {
    case '/api/domain-audit':
      return demoDomainAudit(domain);
    case '/api/http-headers':
      return demoHttpHeaders(domain);
    case '/api/vt-scan-urls':
      return Array.isArray(b.urls) ? (b.urls as string[]).map(demoVtUrl) : [];
    case '/api/vt-url':
      return demoVtUrl(String(b.url ?? ''));
    default:
      return null;
  }
}
