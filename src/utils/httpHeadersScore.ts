// Turns the raw response headers from /api/http-headers into findings and an A–E grade.

import { toScore, type Finding, type Score } from './findings';

export interface HttpHeadersData {
  domain: string;
  https: { ok: boolean; status: number | null; finalUrl: string | null; chain: { url: string; status: number }[]; headers: Record<string, string>; error?: string };
  http: { redirectsToHttps: boolean | null; status: number | null; location: string | null; error?: string };
  checkedAt: string;
}

const SIX_MONTHS = 15_552_000;

export function hstsMaxAge(value: string): number | null {
  const m = /max-age\s*=\s*"?(\d+)"?/i.exec(value);
  return m ? Number(m[1]) : null;
}

/** Directives of a CSP header: { "script-src": "'self' 'unsafe-inline'", … } */
export function parseCsp(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of value.split(';')) {
    const [name, ...rest] = part.trim().split(/\s+/);
    if (name) out[name.toLowerCase()] = rest.join(' ');
  }
  return out;
}

export function scoreHttpHeaders(d: HttpHeadersData): Score {
  const h = d.https.headers;
  const f: Finding[] = [];

  if (!d.https.ok) {
    f.push({
      id: 'https-unreachable', control: 'HTTPS', severity: 'critical', penalty: 40,
      title: 'The website does not answer over HTTPS',
      impact: 'Visitors either get an error or use an unencrypted connection that anyone on the network can read or alter.',
      recommendation: 'Install a TLS certificate (free with Let’s Encrypt or the host’s panel) and serve the site over HTTPS.',
      detail: d.https.error ?? (d.https.status ? `HTTP status ${d.https.status}` : undefined),
    });
    // Without an HTTPS answer the other headers cannot be judged.
    return toScore(f);
  }

  if (d.http.redirectsToHttps === false) {
    f.push({
      id: 'no-https-redirect', control: 'HTTPS', severity: 'high', penalty: 15,
      title: 'The plain HTTP address does not redirect to HTTPS',
      impact: 'Someone who types the address without "https" stays on an unencrypted page.',
      recommendation: 'Add a permanent (301) redirect from http:// to https:// in the host’s settings.',
      detail: d.http.status ? `http:// answered ${d.http.status}${d.http.location ? ` → ${d.http.location}` : ''}` : undefined,
    });
  }

  const hsts = h['strict-transport-security'];
  if (!hsts) {
    f.push({
      id: 'hsts-missing', control: 'HSTS', severity: 'high', penalty: 15,
      title: 'No HSTS header',
      impact: 'Browsers may still try the unencrypted version first, which lets an attacker on public Wi-Fi intercept the visit.',
      recommendation: 'Send "Strict-Transport-Security: max-age=31536000; includeSubDomains".',
    });
  } else {
    const age = hstsMaxAge(hsts);
    if (age === null || age < SIX_MONTHS) {
      f.push({
        id: 'hsts-short', control: 'HSTS', severity: 'medium', penalty: 8, params: { days: Math.round((age ?? 0) / 86400) },
        title: `HSTS lasts only ${Math.round((age ?? 0) / 86400)} days`,
        impact: 'The protection expires quickly; browsers forget it between visits.',
        recommendation: 'Raise max-age to at least 15552000 (6 months), ideally 31536000 (1 year).',
        detail: hsts,
      });
    } else {
      f.push({ id: 'hsts-ok', control: 'HSTS', severity: 'ok', penalty: 0, title: 'HSTS is set', impact: 'Browsers always use HTTPS for this site.', recommendation: '—', detail: hsts });
    }
  }

  const csp = h['content-security-policy'];
  const cspRo = h['content-security-policy-report-only'];
  const cspDirectives = csp ? parseCsp(csp) : {};
  if (!csp) {
    f.push({
      id: cspRo ? 'csp-report-only' : 'csp-missing', control: 'CSP', severity: cspRo ? 'low' : 'medium', penalty: cspRo ? 5 : 10,
      title: cspRo ? 'Content Security Policy is in test mode only' : 'No Content Security Policy',
      impact: 'If an attacker injects a script into a page (for example through a plugin flaw), the browser will run it.',
      recommendation: cspRo
        ? 'Once the reports show no legitimate blocks, switch the header from "Content-Security-Policy-Report-Only" to "Content-Security-Policy".'
        : 'Add a Content-Security-Policy header listing where scripts and styles may come from. Start in report-only mode.',
      detail: cspRo,
    });
  } else {
    const scriptSrc = cspDirectives['script-src'] ?? cspDirectives['default-src'] ?? '';
    const inline = /'unsafe-inline'/.test(scriptSrc) && !/'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(scriptSrc);
    f.push(
      inline
        ? {
            id: 'csp-unsafe-inline', control: 'CSP', severity: 'low', penalty: 4,
            title: 'Content Security Policy allows inline scripts',
            impact: 'The policy exists but would not stop most injected scripts.',
            recommendation: 'Remove \'unsafe-inline\' from script-src and use nonces or hashes for the scripts the site needs.',
            detail: csp,
          }
        : { id: 'csp-ok', control: 'CSP', severity: 'ok', penalty: 0, title: 'Content Security Policy is set', impact: 'The browser limits where scripts may load from.', recommendation: '—', detail: csp },
    );
  }

  const xfo = h['x-frame-options'];
  if (!xfo && !cspDirectives['frame-ancestors']) {
    f.push({
      id: 'clickjacking', control: 'Framing', severity: 'medium', penalty: 8,
      title: 'Other sites can embed this site in a frame',
      impact: 'A fake page can show the real site inside an invisible frame and trick visitors into clicking buttons (clickjacking).',
      recommendation: 'Send "X-Frame-Options: SAMEORIGIN" or add "frame-ancestors \'self\'" to the CSP.',
    });
  }

  if ((h['x-content-type-options'] ?? '').toLowerCase().trim() !== 'nosniff') {
    f.push({
      id: 'nosniff-missing', control: 'MIME', severity: 'low', penalty: 5,
      title: 'No "X-Content-Type-Options: nosniff"',
      impact: 'Browsers may guess file types, which can turn an uploaded file into a running script.',
      recommendation: 'Send "X-Content-Type-Options: nosniff".',
    });
  }

  if (!h['referrer-policy']) {
    f.push({
      id: 'referrer-missing', control: 'Referrer', severity: 'low', penalty: 3,
      title: 'No Referrer-Policy',
      impact: 'Full page addresses, sometimes with personal details in them, are sent to every external site a visitor clicks to.',
      recommendation: 'Send "Referrer-Policy: strict-origin-when-cross-origin".',
    });
  }

  if (!h['permissions-policy']) {
    f.push({
      id: 'permissions-missing', control: 'Permissions', severity: 'low', penalty: 2,
      title: 'No Permissions-Policy',
      impact: 'Embedded third-party content may ask for the camera, microphone or location.',
      recommendation: 'Send a Permissions-Policy that disables features the site does not use, e.g. "camera=(), microphone=(), geolocation=()".',
    });
  }

  const disclosed = [h.server, h['x-powered-by']].filter((v): v is string => !!v && /\d/.test(v));
  if (disclosed.length > 0) {
    f.push({
      id: 'version-disclosed', control: 'Disclosure', severity: 'low', penalty: 3,
      title: 'The server reveals its software versions',
      impact: 'Attackers can look up known flaws for that exact version without any effort.',
      recommendation: 'Hide version numbers in the "Server" and "X-Powered-By" headers (server or hosting settings).',
      detail: disclosed.join(' · '),
    });
  }

  return toScore(f);
}
