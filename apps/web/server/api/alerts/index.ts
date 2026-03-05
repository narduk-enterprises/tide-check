import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { alerts, spots } from '#server/database/schema'

const alertSchema = z.object({
  spotId: z.string().min(1),
  alertType: z.enum(['ideal_tide', 'low_wind', 'swell_threshold']),
  thresholdJson: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const db = useAppDatabase(event)

  if (method === 'GET') {
    const allAlerts = await db.select().from(alerts).orderBy(alerts.createdAt)
    return allAlerts
  }

  if (method === 'POST') {
    await enforceRateLimit(event, 'alerts-create', 10, 60_000)
    const body = await readBody(event)
    const result = alertSchema.safeParse(body)
    if (!result.success) {
      throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Invalid input' })
    }

    // Verify spot exists
    const spotRows = await db.select().from(spots).where(eq(spots.id, result.data.spotId)).limit(1)
    if (!spotRows[0]) throw createError({ statusCode: 404, message: 'Spot not found' })

    const id = crypto.randomUUID()
    await db.insert(alerts).values({
      id,
      spotId: result.data.spotId,
      alertType: result.data.alertType,
      thresholdJson: result.data.thresholdJson,
      isActive: 1,
      createdAt: Date.now(),
    })

    const created = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1)
    setResponseStatus(event, 201)
    return created[0]
  }
})
