import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis() {
  const client = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    enableOfflineQueue: false,
  });
  client.on("error", () => {});
  return client;
}

export const redis = globalForRedis.redis ?? createRedis();

globalForRedis.redis = redis;

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = 60): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch {
    // silent fail - cache is not critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // silent fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys: string[] = [];
    let cursor = "0";
    do {
      const [next, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== "0");
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // silent fail
  }
}

// Simple mutual-exclusion lock so concurrent requests for the same key
// don't all do the expensive work at once (cache stampede protection).
export async function acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const result = await redis.set(key, "1", "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    // Redis unavailable — allow the caller to proceed rather than block it.
    return true;
  }
}

export async function releaseLock(key: string): Promise<void> {
  await cacheDel(key);
}

// Generic failed-attempt counters for brute-force protection (login, etc).
// Fail open on Redis errors so an outage degrades to "no rate limiting"
// rather than locking everyone out.
export async function getAttemptCount(key: string): Promise<number> {
  try {
    const value = await redis.get(key);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

export async function recordAttempt(key: string, ttlSeconds: number): Promise<number> {
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, ttlSeconds);
    return count;
  } catch {
    return 0;
  }
}

export async function clearAttempts(key: string): Promise<void> {
  await cacheDel(key);
}
