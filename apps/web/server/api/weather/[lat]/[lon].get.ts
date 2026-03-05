/**
 * GET /api/weather/:lat/:lon
 * Proxy to Open-Meteo Weather API with D1 caching (1h TTL).
 */
export default defineEventHandler(async (event) => {
  const lat = getRouterParam(event, 'lat')
  const lon = getRouterParam(event, 'lon')
  if (!lat || !lon) throw createError({ statusCode: 400, message: 'Latitude and longitude required' })

  const cacheKey = `weather:${parseFloat(lat).toFixed(2)}:${parseFloat(lon).toFixed(2)}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m,surface_pressure&forecast_days=7&wind_speed_unit=mph`

  try {
    const response = await fetch(url)
    if (!response.ok) throw createError({ statusCode: 502, message: 'Weather API error' })

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 60 * 60 * 1000)
    return data
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode) throw err
    throw createError({ statusCode: 502, message: 'Failed to fetch weather data' })
  }
})
