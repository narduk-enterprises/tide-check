import type { SurfSession } from '~~/server/database/schema'

/**
 * Composable for managing surf/fishing sessions.
 */
export function useSessions() {
  const sessions = useState<SurfSession[]>('sessions', () => [])



  async function fetchSpotSessions(spotId: string) {
    const { data } = await useAsyncData(`sessions-${spotId}`, () =>
      $fetch<SurfSession[]>(`/api/spots/${spotId}/sessions`),
    )
    return data.value || []
  }

  async function createSession(session: {
    spotId: string
    sessionType: 'surf' | 'fishing'
    date: string
    rating?: number
    notes?: string
    catchCount?: number
    conditionsSnapshot?: string
  }) {
    const created = await $fetch<SurfSession>('/api/sessions', {
      method: 'POST',
      body: session,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    sessions.value = [created, ...sessions.value]
    return created
  }

  return {
    sessions,
    fetchSpotSessions,
    createSession,
  }
}

export function useSessionsList() {
  return useFetch<SurfSession[]>('/api/sessions', { key: 'all-sessions' })
}
