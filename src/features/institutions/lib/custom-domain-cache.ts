import "server-only";
import { cache } from "@/core/cache/instance";
import { getRedis } from "@/core/redis/client";
import { keys } from "@/core/redis/keys";

type CacheValue = { institutionId: string } | null;

/** TTL for a verified apex hit (positive cache). */
const POSITIVE_TTL_MS = 60_000;
/** Shorter TTL for "no verified institution here" (negative cache). */
const NEGATIVE_TTL_MS = 30_000;

export function getCustomDomainPositiveTtlMs(): number {
  return POSITIVE_TTL_MS;
}

/** Returns undefined on miss; null means negative cache (unknown/unverified). */
export async function getCachedVerifiedInstitution(
  customDomain: string,
): Promise<CacheValue | undefined> {
  const normalized = customDomain.toLowerCase();
  return cache.get<CacheValue>(keys.domainHost(normalized));
}

export async function setCachedVerifiedInstitution(
  customDomain: string,
  value: CacheValue,
): Promise<void> {
  const ttlMs = value === null ? NEGATIVE_TTL_MS : POSITIVE_TTL_MS;
  await cache.set(keys.domainHost(customDomain.toLowerCase()), value, {
    ttlMs,
  });
}

/** Invalidate one apex or wipe every `greenroom:domain:*` key when omitted. */
export async function invalidateCustomDomainCache(
  customDomain?: string | null,
): Promise<void> {
  if (!customDomain) {
    const redis = getRedis();
    let cursor = "0";
    do {
      const [nextCursor, keysBatch] = await redis.scan(cursor, {
        match: `${keys.domainHost("")}*`,
      });
      cursor = nextCursor;
      if (keysBatch.length > 0) {
        const p = redis.pipeline();
        for (const k of keysBatch) p.del(k);
        await p.exec();
      }
    } while (cursor !== "0");
    return;
  }
  await cache.del(keys.domainHost(customDomain.toLowerCase()));
}

/** Test helper — wipe every cached apex between unit tests. */
export async function __resetCustomDomainCacheForTests(): Promise<void> {
  await invalidateCustomDomainCache();
}
