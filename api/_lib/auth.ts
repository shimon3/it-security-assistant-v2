// Bearer-token check. The token lives only in the ACCESS_TOKEN environment variable
// (Vercel project settings), never in the front-end bundle.

export type AuthResult = 'ok' | 'denied' | 'misconfigured';

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  // Compare full length every time so the duration does not reveal the matching prefix.
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

export function isAuthorized(req: Request): AuthResult {
  const expected = process.env.ACCESS_TOKEN;
  if (!expected || expected.length < 16) return 'misconfigured';

  const header = req.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return 'denied';

  return timingSafeEqual(match[1].trim(), expected) ? 'ok' : 'denied';
}
