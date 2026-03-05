/**
 * GET /api/marine/:lat/:lon
 * Proxy to Open-Meteo Marine API with D1 caching (3h TTL).
 */
export default defineEventHandler(async (event) => {
  const lat = getRouterParam(event, 'lat')
  const lon = getRouterParam(event, 'lon')
  if (!lat || !lon) throw createError({ statusCode: 400, message: 'Latitude and longitude required' })

  const cacheKey = `marine:${parseFloat(lat).toFixed(2)}:${parseFloat(lon).toFixed(2)}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&forecast_days=7`

  try {
    const response = await fetch(url)
    if (!response.ok) throw createError({ statusCode: 502, message: 'Marine API error' })

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 3 * 60 * 60 * 1000)
    return data
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode) throw err
    throw createError({ statusCode: 502, message: 'Failed to fetch marine data' })
  }
})
