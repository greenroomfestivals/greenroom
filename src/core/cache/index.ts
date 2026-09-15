import "server-only";
import type { Redis } from "@upstash/redis";

export interface Cache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, opts: { ttlMs: number }): Promise<void>;
  del(key: string): Promise<void>;
  /**
   * Single-flight cache-aside. On miss, calls `loader`, caches the result,
   * and returns it. On hit, returns the cached value.
   *
   * If `loader` returns `null`, the value is stored with `negativeTtlMs`
   * (or the same `ttlMs` when omitted) so unknown/sentinel responses
   * don't blast the origin on every request.
   *
   * Throws if either Redis or the loader rejects. Callers wrap in try/catch
   * to fail open (e.g. fall back to Postgres).
   */
  wrap<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
    opts?: { negativeTtlMs?: number },
  ): Promise<T>;
}

export function createCache(deps: { redis: Redis }): Cache {
  const { redis } = deps;
  return {
    async get<T>(key: string): Promise<T | undefined> {
      const raw = await redis.get<T>(key);
      return raw !== null ? raw : undefined;
    },
    async set<T>(
      key: string,
      value: T,
      { ttlMs }: { ttlMs: number },
    ): Promise<void> {
      await redis.set(key, value, { px: ttlMs });
    },
    async del(key: string): Promise<void> {
      await redis.del(key);
    },
    async wrap<T>(
      key: string,
      ttlMs: number,
      loader: () => Promise<T>,
      opts?: { negativeTtlMs?: number },
    ): Promise<T> {
      const hit = await redis.get<T>(key);
      if (hit !== null) return hit;
      const value = await loader();
      const effectiveTtl =
        value === null && opts?.negativeTtlMs !== undefined
          ? opts.negativeTtlMs
          : ttlMs;
      await redis.set(key, value, { px: effectiveTtl });
      return value;
    },
  };
}
