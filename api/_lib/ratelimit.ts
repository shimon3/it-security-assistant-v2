// Fixed-window rate limit: LIMIT requests per WINDOW_SECONDS per key (route + IP).
//
// With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counters live in Upstash Redis
// and are shared by every Edge instance. Without them, an in-memory counter is used: it only
// protects a single instance, so configure Upstash in production.

const LIMIT = 10;
const WINDOW_SECONDS = 60;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(key: string, now: number): RateLimitResult {
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  entry.count += 1;
  const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: entry.count <= LIMIT, retryAfterSeconds };
}

async function checkUpstash(url: string, token: string, key: string, now: number): Promise<RateLimitResult> {
  const windowId = Math.floor(now / (WINDOW_SECONDS * 1000));
  const redisKey = `rl:${key}:${windowId}`;
  const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['EXPIRE', redisKey, String(WINDOW_SECONDS)],
    ]),
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  const data = (await res.json()) as Array<{ result?: number }>;
  const count = Number(data[0]?.result ?? 0);
  const retryAfterSeconds = WINDOW_SECONDS - Math.floor((now / 1000) % WINDOW_SECONDS);
  return { allowed: count <= LIMIT, retryAfterSeconds };
}

export async function checkRateLimit(key: string, now: number = Date.now()): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await checkUpstash(url, token, key, now);
    } catch {
      // Redis unreachable: fall back to the local counter rather than failing open.
      return checkInMemory(key, now);
    }
  }
  return checkInMemory(key, now);
}

/** Test helper. */
export function resetInMemoryRateLimit(): void {
  memory.clear();
}
