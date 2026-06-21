export const config = { runtime: 'edge' };

const CORS_ORIGIN = 'https://it-security-assistant-v2.vercel.app';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  const password = (body as Record<string, unknown>)?.password;
  if (typeof password !== 'string' || password === '') {
    return new Response(JSON.stringify({ error: 'Missing or invalid field: password' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  if (password.length > 1024) {
    return new Response(JSON.stringify({ error: 'Input too long' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }

  try {
    const hash = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ pwned: false, count: 0, errorMessage: 'Service temporarily unavailable — try again in a moment' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    if (!res.ok) {
      return new Response(JSON.stringify({ pwned: false, count: 0, errorMessage: 'Check failed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
      });
    }

    const text = await res.text();
    const lines = text.split('\n');

    let count = 0;
    for (const line of lines) {
      const [lineSuffix, lineCount] = line.trim().split(':');
      if (lineSuffix && lineSuffix.toUpperCase() === suffix) {
        count = parseInt(lineCount, 10) || 0;
        break;
      }
    }

    return new Response(JSON.stringify({ pwned: count > 0, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  } catch {
    return new Response(JSON.stringify({ pwned: false, count: 0, errorMessage: 'Check failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': CORS_ORIGIN },
    });
  }
}
