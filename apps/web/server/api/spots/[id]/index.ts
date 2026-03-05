import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { spots } from '#server/database/schema'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  noaaStationId: z.string().optional(),
  spotType: z.enum(['surf', 'fishing', 'both']).optional(),
  description: z.string().max(500).optional(),
  timezone: z.string().min(1).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Spot ID required' })

  const db = useAppDatabase(event)
  const method = getMethod(event)

  if (method === 'GET') {
    const rows = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
    if (!rows[0]) throw createError({ statusCode: 404, message: 'Spot not found' })
    return rows[0]
  }

  if (method === 'PUT') {
    await enforceRateLimit(event, 'spots-update', 20, 60_000)
    const body = await readBody(event)
    const result = updateSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Invalid input' })
    }

    const existing = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
    if (!existing[0]) throw createError({ statusCode: 404, message: 'Spot not found' })

    await db.update(spots).set({
      ...result.data,
      updatedAt: Date.now(),
    }).where(eq(spots.id, id))

    const updated = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
    return updated[0]
  }

  if (method === 'DELETE') {
    await enforceRateLimit(event, 'spots-delete', 10, 60_000)
    const existing = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
    if (!existing[0]) throw createError({ statusCode: 404, message: 'Spot not found' })

    await db.delete(spots).where(eq(spots.id, id))
    return { success: true }
  }
})
