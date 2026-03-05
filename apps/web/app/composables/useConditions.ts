import type { ScoreBreakdown } from '~~/server/utils/scoring'

export interface SpotConditions {
  spot: Record<string, unknown>
  score: ScoreBreakdown
  moon: {
    phase: string
    phaseName: string
    illumination: number
    age: number
    emoji: string
    isWaxing: boolean
    majorPeriods: { start: string; end: string }[]
    minorPeriods: { start: string; end: string }[]
  }
  conditions: {
    tide: { type: string; hoursFromTurn: number; predictions: unknown }
    wind: { speedMph: number; gustMph: number; directionDeg: number; isOffshore: boolean }
    swell: { heightFt: number; periodSec: number; directionDeg: number }
    pressure: { currentMb: number; trend: string }
  }
  marine: unknown
  weather: unknown
  fetchedAt: string
}

/**
 * Composable for fetching spot conditions and Go Score.
 */
export function useConditions(spotId: MaybeRef<string>) {
  const key = computed(() => `conditions-${toValue(spotId)}`)

  const { data, status, refresh } = useAsyncData(
    key.value,
    () => $fetch<SpotConditions>(`/api/spots/${toValue(spotId)}/conditions`),
    { watch: [() => toValue(spotId)] },
  )

  return {
    conditions: data,
    loading: computed(() => status.value === 'pending'),
    refresh,
  }
}

/**
 * Get the color variant for a score rating.
 */
export function getScoreVariant(total: number): 'success' | 'warning' | 'error' {
  if (total >= 70) return 'success'
  if (total >= 45) return 'warning'
  return 'error'
}

/**
 * Get the label for a score rating.
 */
export function getScoreLabel(total: number): string {
  if (total >= 70) return 'Go!'
  if (total >= 45) return 'Maybe'
  return 'No-Go'
}

/**
 * Get wind direction as a compass label.
 */
export function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx] || 'N'
}
