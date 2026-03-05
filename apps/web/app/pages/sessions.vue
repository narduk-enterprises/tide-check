<script setup lang="ts">
useSeo({
  title: 'Session Log — Track Your Surf & Fishing Trips',
  description: 'View and manage your surf and fishing session history across all spots. Filter by spot, type, rating, and date. Track your total sessions and ratings.',
  ogImage: {
    title: 'Session Log — TideCheck',
    description: 'Track your surf and fishing sessions',
    icon: '📓',
  },
})
useWebPageSchema({
  name: 'Session Log — TideCheck',
  description: 'View and manage your surf and fishing session history across all spots.',
})

const { data: sessions } = await useSessionsList()

const { data: spots } = await useSpotsList()

const spotMap = computed(() => {
  const map = new Map<string, string>()
  if (spots.value) {
    for (const spot of spots.value) {
      map.set(spot.id, spot.name)
    }
  }
  return map
})

// Filters
const filterType = ref<string | undefined>(undefined)
const filterSpot = ref<string | undefined>(undefined)
const filterRating = ref<number | undefined>(undefined)

const filteredSessions = computed(() => {
  if (!sessions.value) return []
  return sessions.value.filter((s) => {
    if (filterType.value && s.sessionType !== filterType.value) return false
    if (filterSpot.value && s.spotId !== filterSpot.value) return false
    if (filterRating.value && s.rating !== filterRating.value) return false
    return true
  })
})

// Stats
const totalSessions = computed(() => sessions.value?.length || 0)
const avgRating = computed(() => {
  if (!sessions.value?.length) return 0
  const rated = sessions.value.filter(s => s.rating)
  if (!rated.length) return 0
  const sum = rated.reduce((acc, s) => acc + (s.rating || 0), 0)
  return Math.round(sum / rated.length * 10) / 10
})

const mostVisited = computed(() => {
  if (!sessions.value?.length) return null
  const counts = new Map<string, number>()
  for (const s of sessions.value) {
    counts.set(s.spotId, (counts.get(s.spotId) || 0) + 1)
  }
  let maxId = ''
  let maxCount = 0
  for (const [id, count] of counts) {
    if (count > maxCount) { maxId = id; maxCount = count }
  }
  return spotMap.value.get(maxId) || null
})

function ratingStars(n: number | null): string {
  if (!n) return '—'
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

const spotFilterItems = computed(() => [
  { label: 'All Spots', value: undefined },
  ...(spots.value || []).map(s => ({ label: s.name, value: s.id })),
])
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-display font-bold text-default mb-2">
      Session Log
    </h1>
    <p class="text-muted mb-8">
      Your surf and fishing session history across all spots.
    </p>

    <!-- Stats Summary -->
    <div class="grid sm:grid-cols-3 gap-4 mb-8">
      <div class="condition-card p-5 text-center">
        <div class="text-3xl font-display font-bold text-default">
          {{ totalSessions }}
        </div>
        <div class="text-sm text-muted mt-1">
          Total Sessions
        </div>
      </div>
      <div class="condition-card p-5 text-center">
        <div class="text-3xl font-display font-bold text-warning">
          {{ avgRating || '—' }}
        </div>
        <div class="text-sm text-muted mt-1">
          Average Rating
        </div>
      </div>
      <div class="condition-card p-5 text-center">
        <div class="text-lg font-display font-bold text-primary truncate px-2">
          {{ mostVisited || '—' }}
        </div>
        <div class="text-sm text-muted mt-1">
          Most Visited
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <USelect
        v-model="filterType"
        :items="[{ label: 'All Types', value: undefined }, { label: 'Surf', value: 'surf' }, { label: 'Fishing', value: 'fishing' }]"
        placeholder="Type"
        class="w-36"
      />
      <USelect
        v-model="filterSpot"
        :items="spotFilterItems"
        placeholder="Spot"
        class="w-48"
      />
      <USelect
        v-model="filterRating"
        :items="[{ label: 'Any Rating', value: undefined }, { label: '5 Stars', value: 5 }, { label: '4 Stars', value: 4 }, { label: '3 Stars', value: 3 }, { label: '2 Stars', value: 2 }, { label: '1 Star', value: 1 }]"
        placeholder="Rating"
        class="w-36"
      />
    </div>

    <!-- Empty State -->
    <div v-if="!filteredSessions.length" class="condition-card p-12 text-center">
      <UIcon name="i-lucide-notebook-pen" class="size-10 text-muted mx-auto mb-4" />
      <h2 class="text-lg font-display font-semibold text-default mb-2">
        No sessions found
      </h2>
      <p class="text-muted mb-6">
        {{ sessions?.length ? 'Try adjusting your filters.' : 'Log your first session from a spot detail page!' }}
      </p>
      <UButton v-if="!sessions?.length" to="/dashboard" icon="i-lucide-layout-dashboard">
        Go to Dashboard
      </UButton>
    </div>

    <!-- Sessions List -->
    <div v-else class="space-y-3">
      <div v-for="session in filteredSessions" :key="session.id" class="condition-card p-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <NuxtLink
                v-if="spotMap.get(session.spotId)"
                :to="`/spots/${session.spotId}`"
                class="font-display font-semibold text-default hover:text-primary transition-colors"
              >
                {{ spotMap.get(session.spotId) }}
              </NuxtLink>
              <UBadge :color="session.sessionType === 'surf' ? 'info' : 'success'" variant="subtle" size="sm">
                {{ session.sessionType }}
              </UBadge>
            </div>
            <div class="text-sm text-muted">
              {{ session.date }}
            </div>
            <p v-if="session.notes" class="text-sm text-muted mt-1">
              {{ session.notes }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <div class="text-warning text-sm">
              {{ ratingStars(session.rating) }}
            </div>
            <div v-if="session.catchCount" class="text-xs text-muted mt-1">
              {{ session.catchCount }} caught
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
