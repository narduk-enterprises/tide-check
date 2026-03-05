import { z } from 'zod'
import { eq, desc } from 'drizzle-orm'
import { surfSessions, spots } from '#server/database/schema'

const sessionSchema = z.object({
  spotId: z.string().min(1),
  sessionType: z.enum(['surf', 'fishing']),
  date: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional(),
  conditionsSnapshot: z.string().optional(),
  catchCount: z.number().int().min(0).optional(),
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = useAppDatabase(event)

  if (method === 'GET') {
    const allSessions = await db
      .select()
      .from(surfSessions)
      .orderBy(desc(surfSessions.createdAt))
      .limit(100)
    return allSessions
  }

  if (method === 'POST') {
    await enforceRateLimit(event, 'sessions-create', 20, 60_000)
    const body = await readBody(event)
    const result = sessionSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Invalid input' })
    }

    // Verify spot exists
    const spotRows = await db.select().from(spots).where(eq(spots.id, result.data.spotId)).limit(1)
    if (!spotRows[0]) throw createError({ statusCode: 404, message: 'Spot not found' })

    const id = crypto.randomUUID()
    await db.insert(surfSessions).values({
      id,
      spotId: result.data.spotId,
      sessionType: result.data.sessionType,
      date: result.data.date,
      rating: result.data.rating ?? null,
      notes: result.data.notes ?? null,
      conditionsSnapshot: result.data.conditionsSnapshot ?? null,
      catchCount: result.data.catchCount ?? null,
      createdAt: Date.now(),
    })

    const created = await db.select().from(surfSessions).where(eq(surfSessions.id, id)).limit(1)
    setResponseStatus(event, 201)
    return created[0]
  }
})
