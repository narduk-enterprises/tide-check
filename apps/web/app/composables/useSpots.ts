import type { Spot } from '~~/server/database/schema'

/**
 * Composable for managing surf/fishing spots.
 * Follows the Thin Component, Thick Composable pattern.
 */
export function useSpots() {
  const spots = useState<Spot[]>('spots', () => [])
  const loading = useState<boolean>('spots-loading', () => false)
  const error = useState<string | null>('spots-error', () => null)

  async function fetchSpots() {
    loading.value = true
    error.value = null
    try {
      const { data } = await useAsyncData('spots', () =>
        $fetch<Spot[]>('/api/spots'),
      )
      if (data.value) spots.value = data.value
    }
    catch (err) {
      error.value = 'Failed to load spots'
      console.error(err)
    }
    finally {
      loading.value = false
    }
  }

  async function createSpot(spot: Omit<Spot, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await $fetch<Spot>('/api/spots', {
      method: 'POST',
      body: spot,
    })
    spots.value = [...spots.value, created]
    return created
  }

  async function deleteSpot(id: string) {
    await $fetch(`/api/spots/${id}`, { method: 'DELETE' })
    spots.value = spots.value.filter(s => s.id !== id)
  }

  return {
    spots: readonly(spots),
    loading: readonly(loading),
    error: readonly(error),
    fetchSpots,
    createSpot,
    deleteSpot,
  }
}
