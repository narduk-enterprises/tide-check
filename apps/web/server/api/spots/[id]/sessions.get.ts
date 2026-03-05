import { eq, desc } from 'drizzle-orm'
import { surfSessions } from '#server/database/schema'

/**
 * GET /api/spots/:id/sessions — Sessions for a specific spot.
 */
export default defineEventHandler(async (event) => {
  const spotId = getRouterParam(event, 'id')
  if (!spotId) throw createError({ statusCode: 400, message: 'Spot ID required' })

  const db = useAppDatabase(event)
  const rows = await db
    .select()
    .from(surfSessions)
    .where(eq(surfSessions.spotId, spotId))
    .orderBy(desc(surfSessions.createdAt))
    .limit(50)

  return rows
})
