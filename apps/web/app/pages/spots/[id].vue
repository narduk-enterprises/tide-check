<script setup lang="ts">
const route = useRoute()
const spotId = route.params.id as string

const { conditions, loading } = useConditions(spotId)

useSeo({
  title: `${conditions.value?.spot ? (conditions.value.spot as { name: string }).name : 'Spot'} Conditions — Live Forecast`,
  description: `Real-time tide predictions, swell forecast, wind conditions, and Go/No-Go score for this spot. Check conditions before you head out.`,
  ogImage: {
    title: 'Spot Conditions',
    description: 'Live tide, swell, and wind forecast',
    icon: '🌊',
  },
})
useWebPageSchema({
  name: 'Spot Conditions — TideCheck',
  description: 'Real-time tide predictions, swell forecast, wind conditions, and Go/No-Go score.',
})

definePageMeta({ middleware: ['auth'] })

const { fetchSpotSessions, createSession } = useSessions()
const { data: spotSessions } = await useAsyncData(`spot-sessions-${spotId}`, () =>
  fetchSpotSessions(spotId),
)

const showLogModal = ref(false)
const sessionForm = reactive({
  sessionType: 'surf' as 'surf' | 'fishing',
  date: new Date().toISOString().split('T')[0]!,
  rating: 3,
  notes: '',
  catchCount: 0,
})

const submitting = ref(false)

async function logSession() {
  submitting.value = true
  try {
    await createSession({
      spotId,
      ...sessionForm,
      conditionsSnapshot: conditions.value ? JSON.stringify(conditions.value.score) : undefined,
    })
    showLogModal.value = false
    // Refresh sessions
    const fresh = await fetchSpotSessions(spotId)
    if (spotSessions.value) spotSessions.value = fresh
  }
  finally {
    submitting.value = false
  }
}

const scoreFactors = computed(() => {
  if (!conditions.value?.score?.factors) return []
  const f = conditions.value.score.factors
  return [
    { label: 'Tide', ...f.tide, icon: 'i-lucide-arrow-up-down', percent: getFactorPercent(f.tide.score, f.tide.max), color: getFactorColor(f.tide.score, f.tide.max) },
    { label: 'Wind', ...f.wind, icon: 'i-lucide-wind', percent: getFactorPercent(f.wind.score, f.wind.max), color: getFactorColor(f.wind.score, f.wind.max) },
    { label: 'Swell', ...f.swell, icon: 'i-lucide-waves', percent: getFactorPercent(f.swell.score, f.swell.max), color: getFactorColor(f.swell.score, f.swell.max) },
    { label: 'Moon', ...f.moon, icon: 'i-lucide-moon', percent: getFactorPercent(f.moon.score, f.moon.max), color: getFactorColor(f.moon.score, f.moon.max) },
    { label: 'Pressure', ...f.pressure, icon: 'i-lucide-gauge', percent: getFactorPercent(f.pressure.score, f.pressure.max), color: getFactorColor(f.pressure.score, f.pressure.max) },
  ]
})

function ratingStars(n: number | null): string {
  if (!n) return '—'
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

const spotTypeText = computed(() => {
  if (!conditions.value?.spot) return ''
  const t = (conditions.value.spot as { spotType: string }).spotType
  return t === 'both' ? 'Surf & Fishing' : t === 'surf' ? 'Surf' : 'Fishing'
})

const scoreStrokeColor = computed(() => {
  const t = conditions.value?.score?.total || 0;
  if (t >= 70) return 'var(--color-success-500)';
  if (t >= 45) return 'var(--color-warning-500)';
  return 'var(--color-error-500)';
})

const scoreDashoffset = computed(() => {
  const t = conditions.value?.score?.total || 0;
  return 2 * Math.PI * 50 * (1 - t / 100);
})

const scoreVariantTextClass = computed(() => {
  const t = conditions.value?.score?.total || 0;
  return `text-${getScoreVariant(t)}`;
})

const scoreVariantBadgeColor = computed(() => {
  const t = conditions.value?.score?.total || 0;
  return getScoreVariant(t);
})

function getFactorColor(score: number, max: number): 'success' | 'warning' | 'error' {
  const ratio = score / max;
  return ratio >= 0.7 ? 'success' : ratio >= 0.4 ? 'warning' : 'error';
}

function getFactorPercent(score: number, max: number) {
  return (score / max) * 100;
}

function getSessionBadgeColor(type: string) {
  return type === 'surf' ? 'info' : 'success'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading State -->
    <div v-if="loading && !conditions" class="space-y-6">
      <USkeleton class="h-12 w-64" />
      <div class="grid md:grid-cols-3 gap-6">
        <USkeleton class="h-48" />
        <USkeleton class="h-48" />
        <USkeleton class="h-48" />
      </div>
    </div>

    <template v-else-if="conditions">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <NuxtLink to="/dashboard" class="text-sm text-muted hover:text-default transition-colors flex items-center gap-1 mb-2">
            <UIcon name="i-lucide-arrow-left" class="size-3.5" />
            Dashboard
          </NuxtLink>
          <h1 class="text-3xl font-display font-bold text-default">
            {{ (conditions.spot as { name: string }).name }}
          </h1>
          <p class="text-muted mt-1">
            {{ spotTypeText }}
            · {{ (conditions.spot as { timezone: string }).timezone }}
          </p>
        </div>
        <UButton icon="i-lucide-notebook-pen" @click="showLogModal = true">
          Log Session
        </UButton>
      </div>

      <!-- Score + Factor Breakdown Row -->
      <div class="grid md:grid-cols-4 gap-6 mb-8">
        <!-- Go Score Gauge -->
        <div class="condition-card p-6 flex flex-col items-center justify-center text-center">
          <div class="text-sm text-muted mb-3 font-medium">
            Go Score
          </div>
          <div class="score-ring">
            <!-- eslint-disable-next-line atx/no-inline-svg -->
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle class="score-ring-track" cx="60" cy="60" r="50" stroke-width="10" />
              <circle
                class="score-ring-progress"
                cx="60"
                cy="60"
                r="50"
                stroke-width="10"
                :stroke="scoreStrokeColor"
                :stroke-dasharray="2 * Math.PI * 50"
                :stroke-dashoffset="scoreDashoffset"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span
                class="text-3xl font-display font-bold"
                :class="scoreVariantTextClass"
              >
                {{ conditions.score.total }}
              </span>
              <span class="text-xs text-muted">/ 100</span>
            </div>
          </div>
          <UBadge
            :color="scoreVariantBadgeColor"
            variant="subtle"
            size="lg"
            class="mt-3"
          >
            {{ getScoreLabel(conditions.score.total) }}
          </UBadge>
        </div>

        <!-- Factor Breakdown -->
        <div class="md:col-span-3 condition-card p-6">
          <h2 class="font-display font-semibold text-default mb-4">
            Score Breakdown
          </h2>
          <div class="space-y-3">
            <div v-for="factor in scoreFactors" :key="factor.label" class="flex items-center gap-3">
              <UIcon :name="factor.icon" class="size-5 text-muted shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-default">{{ factor.label }}</span>
                  <span class="text-sm text-muted">{{ factor.score }}/{{ factor.max }}</span>
                </div>
                <!-- eslint-disable-next-line vue-official/no-template-complex-expressions -->
                <UProgress :value="factor.percent" size="sm" :color="factor.color" />
                <p class="text-xs text-muted mt-1">
                  {{ factor.details }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Conditions Cards -->
      <h2 class="text-xl font-display font-semibold text-default mb-4">
        Current Conditions
      </h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Wind -->
        <div class="condition-card p-5">
          <div class="flex items-center gap-2 text-sm text-muted mb-3">
            <UIcon name="i-lucide-wind" class="size-4" />
            Wind
          </div>
          <div class="text-2xl font-display font-bold text-default">
            {{ conditions.conditions.wind.speedMph }} mph
          </div>
          <div class="text-sm text-muted mt-1">
            Gusts {{ conditions.conditions.wind.gustMph }} mph · {{ windDirection(conditions.conditions.wind.directionDeg) }}
          </div>
        </div>

        <!-- Swell -->
        <div class="condition-card p-5">
          <div class="flex items-center gap-2 text-sm text-muted mb-3">
            <UIcon name="i-lucide-waves" class="size-4" />
            Swell
          </div>
          <div class="text-2xl font-display font-bold text-default">
            {{ conditions.conditions.swell.heightFt }} ft
          </div>
          <div class="text-sm text-muted mt-1">
            {{ conditions.conditions.swell.periodSec }}s period · {{ windDirection(conditions.conditions.swell.directionDeg) }}
          </div>
        </div>

        <!-- Tide -->
        <div class="condition-card p-5">
          <div class="flex items-center gap-2 text-sm text-muted mb-3">
            <UIcon name="i-lucide-arrow-up-down" class="size-4" />
            Tide
          </div>
          <div class="text-2xl font-display font-bold text-default capitalize">
            {{ conditions.conditions.tide.type }}
          </div>
          <div class="text-sm text-muted mt-1">
            {{ conditions.conditions.tide.hoursFromTurn }}h since turn
          </div>
        </div>

        <!-- Pressure -->
        <div class="condition-card p-5">
          <div class="flex items-center gap-2 text-sm text-muted mb-3">
            <UIcon name="i-lucide-gauge" class="size-4" />
            Pressure
          </div>
          <div class="text-2xl font-display font-bold text-default">
            {{ conditions.conditions.pressure.currentMb }} mb
          </div>
          <div class="text-sm text-muted mt-1 capitalize">
            {{ conditions.conditions.pressure.trend }}
          </div>
        </div>
      </div>

      <!-- Moon Phase -->
      <div class="condition-card p-6 mb-8">
        <div class="flex items-center gap-4">
          <div class="text-5xl">
            {{ conditions.moon.emoji }}
          </div>
          <div>
            <h3 class="font-display font-semibold text-default">
              {{ conditions.moon.phaseName }}
            </h3>
            <p class="text-sm text-muted">
              {{ conditions.moon.illumination }}% illumination · {{ conditions.moon.age }} days old
            </p>
            <div class="flex gap-4 mt-2 text-xs text-muted">
              <span v-for="(period, i) in conditions.moon.majorPeriods" :key="`major-${i}`">
                Major: {{ period.start }}–{{ period.end }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Session History -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-display font-semibold text-default">
          Session History
        </h2>
      </div>

      <div v-if="!spotSessions?.length" class="condition-card p-8 text-center">
        <UIcon name="i-lucide-notebook-pen" class="size-8 text-muted mx-auto mb-3" />
        <p class="text-muted">
          No sessions logged yet. Hit "Log Session" after your next trip!
        </p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="session in spotSessions" :key="session.id" class="condition-card p-4 flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2">
              <UBadge :color="getSessionBadgeColor(session.sessionType)" variant="subtle" size="sm">
                {{ session.sessionType }}
              </UBadge>
              <span class="text-sm text-default font-medium">{{ session.date }}</span>
            </div>
            <p v-if="session.notes" class="text-sm text-muted mt-1">
              {{ session.notes }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-warning text-sm">
              {{ ratingStars(session.rating) }}
            </div>
            <div v-if="session.catchCount" class="text-xs text-muted mt-1">
              {{ session.catchCount }} caught
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Log Session Modal -->
    <USlideover v-model:open="showLogModal">
      <template #title>
        Log Session
      </template>
      <template #body>
        <div class="form-section">
          <UFormField label="Session Type">
            <USelect v-model="sessionForm.sessionType" :items="[{ label: 'Surf', value: 'surf' }, { label: 'Fishing', value: 'fishing' }]" class="w-full" />
          </UFormField>
          <UFormField label="Date">
            <UInput v-model="sessionForm.date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Rating (1-5)">
            <USelect v-model="sessionForm.rating" :items="[{ label: '1 Star', value: 1 }, { label: '2 Stars', value: 2 }, { label: '3 Stars', value: 3 }, { label: '4 Stars', value: 4 }, { label: '5 Stars', value: 5 }]" class="w-full" />
          </UFormField>
          <UFormField v-if="sessionForm.sessionType === 'fishing'" label="Catch Count">
            <UInput v-model.number="sessionForm.catchCount" type="number" min="0" class="w-full" />
          </UFormField>
          <UFormField label="Notes">
            <UTextarea v-model="sessionForm.notes" placeholder="How was it?" :rows="3" class="w-full" />
          </UFormField>
          <div class="form-actions">
            <UButton variant="outline" color="neutral" @click="showLogModal = false">
              Cancel
            </UButton>
            <UButton :loading="submitting" @click="logSession">
              Save Session
            </UButton>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
