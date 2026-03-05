import type { SurfSession } from '~~/server/database/schema'

/**
 * Composable for managing surf/fishing sessions.
 */
export function useSessions() {
  const sessions = useState<SurfSession[]>('sessions', () => [])
  const loading = useState<boolean>('sessions-loading', () => false)

  async function fetchSessions() {
    loading.value = true
    try {
      const { data } = await useAsyncData('sessions', () =>
        $fetch<SurfSession[]>('/api/sessions'),
      )
      if (data.value) sessions.value = data.value
    }
    finally {
      loading.value = false
    }
  }

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
    })
    sessions.value = [created, ...sessions.value]
    return created
  }

  return {
    sessions: readonly(sessions),
    loading: readonly(loading),
    fetchSessions,
    fetchSpotSessions,
    createSession,
  }
}
