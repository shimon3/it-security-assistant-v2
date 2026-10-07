// Have I Been Pwned "Pwned Passwords" check using k-anonymity.
// The password is hashed in the browser; only the first 5 hex characters of its SHA-1
// leave the device. The API is free and needs no key.

export interface PwnedResult {
  pwned: boolean;
  count: number;
}

export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Finds `suffix` in a range response ("SUFFIX:COUNT" per line). Padding lines have count 0. */
export function countInRange(rangeBody: string, suffix: string): number {
  const target = suffix.toUpperCase();
  for (const line of rangeBody.split('\n')) {
    const [s, c] = line.trim().split(':');
    if (s?.toUpperCase() === target) return Number(c) || 0;
  }
  return 0;
}

export async function checkPwnedPassword(password: string, fetchImpl: typeof fetch = fetch): Promise<PwnedResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetchImpl(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  });
  if (!res.ok) {
    throw new Error(res.status === 429 ? 'Service busy — try again in a moment' : `Check failed (${res.status})`);
  }

  const count = countInRange(await res.text(), suffix);
  return { pwned: count > 0, count };
}
