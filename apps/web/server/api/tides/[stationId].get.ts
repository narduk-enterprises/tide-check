/**
 * GET /api/tides/:stationId
 * Proxy to NOAA CO-OPS API with D1 caching (6h TTL).
 */
export default defineEventHandler(async (event) => {
  const stationId = getRouterParam(event, 'stationId')
  if (!stationId) throw createError({ statusCode: 400, message: 'Station ID required' })

  const cacheKey = `tides:${stationId}`
  const cached = await getCachedResponse(event, cacheKey)
  if (cached) return JSON.parse(cached)

  const now = new Date()
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const beginDate = formatDate(now)
  const endDate = formatDate(end)

  const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&format=json&station=${stationId}&begin_date=${beginDate}&end_date=${endDate}&interval=hilo`

  try {
    const response = await fetch(url)
    if (!response.ok) throw createError({ statusCode: 502, message: 'NOAA API error' })

    const data = await response.json()
    await setCachedResponse(event, cacheKey, JSON.stringify(data), 6 * 60 * 60 * 1000)
    return data
  }
  catch (err) {
    if ((err as { statusCode?: number }).statusCode) throw err
    throw createError({ statusCode: 502, message: 'Failed to fetch tide data' })
  }
})

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}
