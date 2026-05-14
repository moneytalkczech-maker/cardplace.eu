import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL;

let redis: Redis | null = null;
if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });
}

const TTL = {
  AUCTIONS_LIST: 30,
  AUCTION_DETAIL: 60,
  CARD_SEARCH: 300,
  FEATURED: 60,
  TRENDING: 60,
};

export { TTL };

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, data: any, ttl: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {}
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
}

export async function cacheHealth(): Promise<boolean> {
  if (!redis) return false;
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}