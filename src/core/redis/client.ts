import "server-only";
import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

function isBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build"
  );
}

/**
 * Lazy ioredis construction. The singleton is built on first access so the
 * `next build` "Collecting page data" phase can import this module without
 * throwing when `REDIS_URL` is unset (e.g. during CI builds that don't need
 * Redis). Mirrors `src/core/database/client.ts`.
 */
export function getRedis(): Redis {
  if (globalForRedis.redis) return globalForRedis.redis;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "REDIS_REST_URL or REDIS_REST_TOKEN is not set. Upstash REST API required.",
    );
  }

  if (isBuildPhase()) {
    throw new Error(
      "Redis client accessed during build phase (REDIS_REST_URL likely not set)",
    );
  }

  const client = new Redis({
    url,
    token,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = client;
  }

  return client;
}
