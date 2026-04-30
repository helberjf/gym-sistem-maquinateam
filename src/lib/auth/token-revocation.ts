import { Redis } from "@upstash/redis";

const KEY_PREFIX = "auth:revoked:";
const TTL_SECS = 7 * 24 * 60 * 60; // 7 days — covers any reasonable JWT max-age

function getRedis(): Redis | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function revokeUserTokens(userId: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const revokedAt = Math.floor(Date.now() / 1000);

  try {
    await redis.setex(`${KEY_PREFIX}${userId}`, TTL_SECS, revokedAt);
  } catch {
    // Non-fatal: the periodic DB recheck will catch isActive changes anyway
  }
}

export async function getRevocationTimestamp(
  userId: string,
): Promise<number | null> {
  const redis = getRedis();

  if (!redis) {
    return null;
  }

  try {
    const value = await redis.get<number>(`${KEY_PREFIX}${userId}`);
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}
