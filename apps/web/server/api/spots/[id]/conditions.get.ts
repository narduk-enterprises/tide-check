import { eq } from 'drizzle-orm'
import { spots } from '#server/database/schema'
import { calculateMoonPhase, getMoonScore } from '#server/utils/moonPhase'
import { calculateGoScore } from '#server/utils/scoring'

import type { H3Event } from 'h3'

/**
 * GET /api/spots/:id/conditions
 *
 * Composite endpoint: fetches tides + marine + weather + moon for this spot,
 * runs the scoring algorithm, and returns a unified conditions response.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Spot ID required' })

  const db = useAppDatabase(event)
  const rows = await db.select().from(spots).where(eq(spots.id, id)).limit(1)
  const spot = rows[0]
  if (!spot) throw createError({ statusCode: 404, message: 'Spot not found' })

  // Fetch all data sources in parallel
  const [tideData, marineData, weatherData] = await Promise.all([
    fetchTideData(event, spot.noaaStationId),
    fetchMarineData(event, spot.latitude, spot.longitude),
    fetchWeatherData(event, spot.latitude, spot.longitude),
  ])

  const now = new Date()
  const moonData = calculateMoonPhase(now)
  const moonScore = getMoonScore(now)

  // Derive tide phase from tide predictions
  const tidePhase = deriveTidePhase(tideData, now)

  // Derive wind info
  const windInfo = deriveCurrentWind(weatherData, now)

  // Derive swell info
  const swellInfo = deriveCurrentSwell(marineData, now)

  // Derive pressure info
  const pressureInfo = deriveCurrentPressure(weatherData, now)

  // Calculate Go Score
  const score = calculateGoScore({
    spotType: spot.spotType as 'surf' | 'fishing' | 'both',
    tide: tidePhase,
    wind: windInfo,
    swell: swellInfo,
    pressure: pressureInfo,
    moonScore,
  })

  return {
    spot,
    score,
    moon: moonData,
    conditions: {
      tide: { ...tidePhase, predictions: tideData },
      wind: windInfo,
      swell: swellInfo,
      pressure: pressureInfo,
    },
    marine: marineData,
    weather: weatherData,
    fetchedAt: now.toISOString(),
  }
})

async function fetchTideData(event: H3Event, stationId: string | null) {
  if (!stationId) return null

  const cacheKey = `tides:${stationId}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  try {
    const now = new Date()
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const beginDate = formatNoaaDate(now)
    const endDate = formatNoaaDate(end)

    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&format=json&station=${stationId}&begin_date=${beginDate}&end_date=${endDate}&interval=hilo`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 6 * 60 * 60 * 1000) // 6 hours
    return data
  }
  catch {
    return null
  }
}

async function fetchMarineData(event: H3Event, lat: number, lon: number) {
  const cacheKey = `marine:${lat.toFixed(2)}:${lon.toFixed(2)}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&forecast_days=7`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 3 * 60 * 60 * 1000) // 3 hours
    return data
  }
  catch {
    return null
  }
}

async function fetchWeatherData(event: H3Event, lat: number, lon: number) {
  const cacheKey = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,surface_pressure&forecast_days=7&wind_speed_unit=mph`

    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 60 * 60 * 1000) // 1 hour
    return data
  }
  catch {
    return null
  }
}

function formatNoaaDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function deriveTidePhase(tideData: Record<string, unknown> | null, now: Date): { type: 'rising' | 'falling' | 'high' | 'low'; hoursFromTurn: number } {
  if (!tideData || !('predictions' in tideData) || !Array.isArray(tideData.predictions)) {
    return { type: 'rising', hoursFromTurn: 3 }
  }

  const predictions = tideData.predictions as { t: string; v: string; type: string }[]
  const nowMs = now.getTime()

  // Find the two nearest tide events (one before, one after)
  let lastEvent: { t: string; v: string; type: string } | null = null
  let nextEvent: { t: string; v: string; type: string } | null = null

  for (const p of predictions) {
    const eventTime = new Date(p.t).getTime()
    if (eventTime <= nowMs) {
      lastEvent = p
    }
    else if (!nextEvent) {
      nextEvent = p
      break
    }
  }

  if (!lastEvent) return { type: 'rising', hoursFromTurn: 3 }

  const lastTime = new Date(lastEvent.t).getTime()
  const hoursFromTurn = (nowMs - lastTime) / (1000 * 60 * 60)

  // H = High, L = Low
  if (lastEvent.type === 'L') {
    return { type: 'rising', hoursFromTurn: Math.round(hoursFromTurn * 10) / 10 }
  }
  else {
    return { type: 'falling', hoursFromTurn: Math.round(hoursFromTurn * 10) / 10 }
  }
}

function deriveCurrentWind(weatherData: Record<string, unknown> | null, now: Date): { speedMph: number; gustMph: number; directionDeg: number; isOffshore: boolean } {
  if (!weatherData || !('hourly' in weatherData)) {
    return { speedMph: 10, gustMph: 15, directionDeg: 180, isOffshore: false }
  }

  const hourly = weatherData.hourly as {
    time: string[]
    wind_speed_10m: number[]
    wind_direction_10m: number[]
    wind_gusts_10m: number[]
  }

  const idx = findClosestHourIndex(hourly.time, now)
  return {
    speedMph: Math.round(hourly.wind_speed_10m[idx] || 10),
    gustMph: Math.round(hourly.wind_gusts_10m[idx] || 15),
    directionDeg: hourly.wind_direction_10m[idx] || 180,
    isOffshore: false, // Would need spot orientation to determine
  }
}

function deriveCurrentSwell(marineData: Record<string, unknown> | null, now: Date): { heightFt: number; periodSec: number; directionDeg: number } {
  if (!marineData || !('hourly' in marineData)) {
    return { heightFt: 2, periodSec: 8, directionDeg: 180 }
  }

  const hourly = marineData.hourly as {
    time: string[]
    swell_wave_height: (number | null)[]
    swell_wave_period: (number | null)[]
    swell_wave_direction: (number | null)[]
    wave_height: (number | null)[]
    wave_period: (number | null)[]
    wave_direction: (number | null)[]
  }

  const idx = findClosestHourIndex(hourly.time, now)
  // Prefer swell data, fall back to wave data
  const heightM = hourly.swell_wave_height?.[idx] ?? hourly.wave_height?.[idx] ?? 0.6
  const heightFt = Math.round(heightM * 3.281 * 10) / 10 // meters to feet

  return {
    heightFt,
    periodSec: Math.round(hourly.swell_wave_period?.[idx] ?? hourly.wave_period?.[idx] ?? 8),
    directionDeg: hourly.swell_wave_direction?.[idx] ?? hourly.wave_direction?.[idx] ?? 180,
  }
}

function deriveCurrentPressure(weatherData: Record<string, unknown> | null, now: Date): { currentMb: number; trend: 'rising' | 'falling' | 'steady' } {
  if (!weatherData || !('hourly' in weatherData)) {
    return { currentMb: 1013, trend: 'steady' }
  }

  const hourly = weatherData.hourly as {
    time: string[]
    surface_pressure: number[]
  }

  const idx = findClosestHourIndex(hourly.time, now)
  const current = hourly.surface_pressure[idx] || 1013
  const previous = hourly.surface_pressure[Math.max(0, idx - 3)] || current

  let trend: 'rising' | 'falling' | 'steady'
  if (current - previous > 1) trend = 'rising'
  else if (previous - current > 1) trend = 'falling'
  else trend = 'steady'

  return { currentMb: Math.round(current), trend }
}

function findClosestHourIndex(times: string[], now: Date): number {
  const nowMs = now.getTime()
  let closest = 0
  let minDiff = Infinity

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]!).getTime() - nowMs)
    if (diff < minDiff) {
      minDiff = diff
      closest = i
    }
  }

  return closest
}
