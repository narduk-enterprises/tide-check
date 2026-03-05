import type { H3Event } from 'h3'
import { eq, and, lt } from 'drizzle-orm'
import { apiCache } from '#server/database/schema'

/**
 * Read from the D1-backed API cache.
 * Returns null if the key is missing or expired.
 */
export async function getCachedResponse(event: H3Event, cacheKey: string): Promise<string | null> {
  const db = useAppDatabase(event)
  const now = Date.now()

  const rows = await db
    .select({ data: apiCache.data })
    .from(apiCache)
    .where(and(eq(apiCache.key, cacheKey)))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  // Check expiry — we store expiresAt as unix ms
  const meta = await db
    .select({ expiresAt: apiCache.expiresAt })
    .from(apiCache)
    .where(eq(apiCache.key, cacheKey))
    .limit(1)

  if (meta[0] && meta[0].expiresAt < now) {
    // Expired — clean up and return null
    await db.delete(apiCache).where(eq(apiCache.key, cacheKey))
    return null
  }

  return row.data
}

/**
 * Write to the D1-backed API cache with a TTL (in milliseconds).
 */
export async function setCachedResponse(event: H3Event, cacheKey: string, data: string, ttlMs: number): Promise<void> {
  const db = useAppDatabase(event)
  const now = Date.now()

  await db
    .insert(apiCache)
    .values({
      key: cacheKey,
      data,
      expiresAt: now + ttlMs,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: apiCache.key,
      set: {
        data,
        expiresAt: now + ttlMs,
        createdAt: now,
      },
    })
}

/**
 * Clean up expired cache entries. Call periodically.
 */
export async function cleanExpiredCache(event: H3Event): Promise<void> {
  const db = useAppDatabase(event)
  await db.delete(apiCache).where(lt(apiCache.expiresAt, Date.now()))
}
