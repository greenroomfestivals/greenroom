import { Redis } from "ioredis";

let redisClient: Redis | null = null;

export function getNodeRedis(): Redis {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL;
  if (!url) {
    throw new Error("Missing Redis connection URL");
  }
  // Upstash REST URL doesn't work for ioredis, the user must provide a TCP connection URL
  // But wait, the environment might only have UPSTASH_REDIS_REST_URL.
  // Let's assume REDIS_URL is provided for the pub/sub parts.
  redisClient = new Redis(url, {
    maxRetriesPerRequest: 1, // Fail fast on connection errors
    lazyConnect: true, // Only connect when needed
  });
  return redisClient;
}
