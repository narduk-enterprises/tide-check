import { eq } from 'drizzle-orm'
import { alerts } from '#server/database/schema'

/**
 * DELETE /api/alerts/:id
 */
export default defineEventHandler(async (event) => {
  await enforceRateLimit(event, 'alerts-delete', 10, 60_000)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Alert ID required' })

  const db = useAppDatabase(event)
  const existing = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1)
  if (!existing[0]) throw createError({ statusCode: 404, message: 'Alert not found' })

  await db.delete(alerts).where(eq(alerts.id, id))
  return { success: true }
})
