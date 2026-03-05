import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { spots } from '#server/database/schema'

const spotSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  noaaStationId: z.string().optional(),
  spotType: z.enum(['surf', 'fishing', 'both']),
  description: z.string().max(500).optional(),
  timezone: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    const db = useAppDatabase(event)
    const allSpots = await db.select().from(spots).orderBy(spots.name)
    return allSpots
  }

  if (method === 'POST') {
    await enforceRateLimit(event, 'spots-create', 10, 60_000)
    const body = await readBody(event)
    const result = spotSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Invalid input' })
    }

    const db = useAppDatabase(event)
    const now = Date.now()
    const id = crypto.randomUUID()

    await db.insert(spots).values({
      id,
      name: result.data.name,
      latitude: result.data.latitude,
      longitude: result.data.longitude,
      noaaStationId: result.data.noaaStationId || null,
      spotType: result.data.spotType,
      description: result.data.description || null,
      timezone: result.data.timezone,
      createdAt: now,
      updatedAt: now,
    })

    const created = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
    setResponseStatus(event, 201)
    return created[0]
  }
})
