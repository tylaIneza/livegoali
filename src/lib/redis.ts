import { Redis } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

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
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // silent fail
  }
}
