import type { ScoreBreakdown } from '~~/server/utils/scoring'

// eslint-disable-next-line vue-official/require-use-prefix-for-composables
export const fetchSpotConditionsData = (spotId: string) => $fetch<SpotConditions>(`/api/spots/${spotId}/conditions`)

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
  const { data, status, refresh } = useAsyncData(
    `conditions-${toValue(spotId)}`,
    () => $fetch<SpotConditions>(`/api/spots/${toValue(spotId)}/conditions`),
    { watch: [() => toValue(spotId)] },
  )

  return {
    conditions: data,
    loading: computed(() => status.value === 'pending'),
    refresh,
  }
}

export function useMoonData() {
  return useAsyncData('moon', () => $fetch<{ phaseName: string; emoji: string; illumination: number; age: number; majorPeriods: { start: string, end: string }[] }>('/api/moon'))
}

// eslint-disable-next-line vue-official/require-use-prefix-for-composables
export function getScoreVariant(total: number): 'success' | 'warning' | 'error' {
  if (total >= 70) return 'success'
  if (total >= 45) return 'warning'
  return 'error'
}

// eslint-disable-next-line vue-official/require-use-prefix-for-composables
export function getScoreLabel(total: number): string {
  if (total >= 70) return 'Go!'
  if (total >= 45) return 'Maybe'
  return 'No-Go'
}

// eslint-disable-next-line vue-official/require-use-prefix-for-composables
export function windDirection(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const idx = Math.round(deg / 22.5) % 16
  return dirs[idx] || 'N'
}
