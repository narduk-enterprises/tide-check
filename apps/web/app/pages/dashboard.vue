<script setup lang="ts">
import type { Spot } from '~~/server/database/schema'
import type { SpotConditions } from '~/composables/useConditions'

useSeo({
  title: 'Dashboard — Spot Conditions Overview',
  description: 'View all your saved surf and fishing spots with real-time Go/No-Go scores, current wind, swell, tide conditions, and moon phase at a glance.',
  ogImage: {
    title: 'TideCheck Dashboard',
    description: 'Real-time conditions for all your spots',
    icon: '📊',
  },
})
useWebPageSchema({
  name: 'TideCheck Dashboard',
  description: 'View all your saved surf and fishing spots with real-time Go/No-Go scores.',
})

const { data: spots } = await useSpotsList()

// Fetch conditions for all spots in parallel
const { data: allConditions } = await useAsyncData('dashboard-conditions', async () => {
  if (!spots.value?.length) return []
  const results = await Promise.all(
    spots.value.map(async (spot) => {
      try {
        const conditions = await fetchSpotConditionsData(spot.id)
        return { spotId: spot.id, conditions }
      }
      catch {
        return { spotId: spot.id, conditions: null }
      }
    }),
  )
  return results
}, { watch: [spots] })

const conditionsMap = computed(() => {
  const map = new Map<string, SpotConditions>()
  if (allConditions.value) {
    for (const item of allConditions.value) {
      if (item.conditions) map.set(item.spotId, item.conditions)
    }
  }
  return map
})

const bestSpot = computed(() => {
  if (!spots.value?.length) return null
  let best: { spot: Spot; score: number } | null = null
  for (const spot of spots.value) {
    const conditions = conditionsMap.value.get(spot.id)
    if (conditions && (!best || conditions.score.total > best.score)) {
      best = { spot, score: conditions.score.total }
    }
  }
  return best
})

const bestSpotScoreVariant = computed(() => {
  if (!bestSpot.value) return 'error'
  return getScoreVariant(bestSpot.value.score)
})

function getSpotTypeText(spotType: string) {
  return spotType === 'both' ? 'Surf & Fishing' : spotType === 'surf' ? 'Surf' : 'Fishing'
}

function getSpotBadgeColor(spotId: string) {
  const c = conditionsMap.value.get(spotId);
  return c ? getScoreVariant(c.score.total) : 'neutral';
}

function getSpotScoreTotal(spotId: string) {
  return conditionsMap.value.get(spotId)?.score.total ?? 0;
}

const { data: moonData } = await useMoonData()
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-default">
          Dashboard
        </h1>
        <p class="text-muted mt-1">
          Your coastal conditions at a glance
        </p>
      </div>
      <UButton to="/spots/new" icon="i-lucide-plus" size="lg">
        Add Spot
      </UButton>
    </div>

    <!-- Empty State -->
    <div v-if="!spots?.length" class="text-center py-20">
      <div class="size-16 rounded-2xl ocean-gradient flex items-center justify-center mx-auto mb-6">
        <UIcon name="i-lucide-map-pin" class="size-8 text-white" />
      </div>
      <h2 class="text-xl font-display font-semibold text-default mb-2">
        No spots yet
      </h2>
      <p class="text-muted mb-6 max-w-md mx-auto">
        Add your favorite surf breaks and fishing holes to start tracking conditions.
      </p>
      <UButton to="/spots/new" icon="i-lucide-plus">
        Add Your First Spot
      </UButton>
    </div>

    <template v-else>
      <!-- Top Row: Best Spot + Moon Phase -->
      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <!-- Best Spot Card -->
        <div v-if="bestSpot" class="md:col-span-2 condition-card p-6">
          <div class="flex items-center gap-2 text-sm text-muted mb-3">
            <UIcon name="i-lucide-trophy" class="size-4 text-primary" />
            Best spot right now
          </div>
          <div class="flex items-center justify-between">
            <div>
              <NuxtLink :to="`/spots/${bestSpot.spot.id}`" class="text-2xl font-display font-bold text-default hover:text-primary transition-colors">
                {{ bestSpot.spot.name }}
              </NuxtLink>
              <p class="text-muted mt-1">
                {{ getSpotTypeText(bestSpot.spot.spotType) }}
              </p>
            </div>
            <div class="text-center">
              <div
                class="text-4xl font-display font-bold"
                :class="['text-' + bestSpotScoreVariant]"
              >
                {{ bestSpot.score }}
              </div>
              <UBadge
                :color="bestSpotScoreVariant"
                variant="subtle"
                size="sm"
              >
                {{ getScoreLabel(bestSpot.score) }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Moon Phase Card -->
        <div class="condition-card p-6 flex flex-col items-center justify-center text-center">
          <div class="text-4xl mb-2">
            {{ moonData?.emoji || '🌙' }}
          </div>
          <div class="font-display font-semibold text-default">
            {{ moonData?.phaseName || 'Loading...' }}
          </div>
          <div class="text-sm text-muted mt-1">
            {{ moonData?.illumination || 0 }}% illumination
          </div>
        </div>
      </div>

      <!-- Spots Grid -->
      <h2 class="text-xl font-display font-semibold text-default mb-4">
        Your Spots
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="spot in spots"
          :key="spot.id"
          :to="`/spots/${spot.id}`"
          class="condition-card p-5 group cursor-pointer"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <h3 class="font-display font-semibold text-default group-hover:text-primary transition-colors">
                {{ spot.name }}
              </h3>
              <p class="text-xs text-muted mt-0.5">
                {{ getSpotTypeText(spot.spotType) }}
              </p>
            </div>
            <template v-if="conditionsMap.get(spot.id)">
              <UBadge
                :color="getSpotBadgeColor(spot.id)"
                variant="subtle"
                size="lg"
                class="font-display font-bold"
              >
                {{ getSpotScoreTotal(spot.id) }}
              </UBadge>
            </template>
            <USkeleton v-else class="w-10 h-7 rounded-full" />
          </div>

          <template v-if="conditionsMap.get(spot.id)">
            <div class="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <UIcon name="i-lucide-wind" class="size-4 text-muted mx-auto mb-1" />
                <div class="font-medium text-default">
                  {{ conditionsMap.get(spot.id)!.conditions.wind.speedMph }} mph
                </div>
                <div class="text-muted">
                  Wind
                </div>
              </div>
              <div>
                <UIcon name="i-lucide-waves" class="size-4 text-muted mx-auto mb-1" />
                <div class="font-medium text-default">
                  {{ conditionsMap.get(spot.id)!.conditions.swell.heightFt }} ft
                </div>
                <div class="text-muted">
                  Swell
                </div>
              </div>
              <div>
                <UIcon name="i-lucide-arrow-up-down" class="size-4 text-muted mx-auto mb-1" />
                <div class="font-medium text-default capitalize">
                  {{ conditionsMap.get(spot.id)!.conditions.tide.type }}
                </div>
                <div class="text-muted">
                  Tide
                </div>
              </div>
            </div>
          </template>
          <div v-else class="space-y-2">
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-2/3" />
          </div>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
