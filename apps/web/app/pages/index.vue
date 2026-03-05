<script setup lang="ts">
useSeo({
  title: 'Real-Time Tide, Surf & Fishing Conditions',
  description: 'Check real-time tide predictions, swell forecasts, wind conditions, and moon phases. Get a Go/No-Go score before you head to the beach or pier.',
  ogImage: {
    title: 'TideCheck — Know Before You Go',
    description: 'Real-time conditions dashboard for surfers and anglers',
    icon: '🌊',
  },
})
useWebPageSchema({
  name: 'TideCheck — Real-Time Tide, Surf & Fishing Conditions',
  description: 'Check real-time tide predictions, swell forecasts, wind conditions, and moon phases. Get a Go/No-Go score before you head to the beach or pier.',
})

const features = [
  {
    icon: 'i-lucide-waves',
    title: 'Tide Predictions',
    description: '7-day NOAA tide forecasts with high/low predictions and hourly water levels.',
  },
  {
    icon: 'i-lucide-wind',
    title: 'Wind & Swell',
    description: 'Real-time wind speed, gusts, and swell height from marine weather stations.',
  },
  {
    icon: 'i-lucide-gauge',
    title: 'Go/No-Go Score',
    description: 'Smart composite score weighing tides, wind, swell, moon phase, and pressure.',
  },
  {
    icon: 'i-lucide-moon',
    title: 'Moon & Solunar',
    description: 'Current moon phase with major and minor feeding periods for peak fishing.',
  },
  {
    icon: 'i-lucide-map-pin',
    title: 'Save Your Spots',
    description: 'Track your favorite coastal locations with NOAA station auto-detection.',
  },
  {
    icon: 'i-lucide-notebook-pen',
    title: 'Session Log',
    description: 'Log your surf and fishing sessions with conditions snapshots and ratings.',
  },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden ocean-gradient-subtle">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div class="text-center max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
            <UIcon name="i-lucide-waves" class="size-4" />
            Real-time coastal conditions
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-default leading-tight animate-fade-up stagger-1">
            Know Before
            <span class="text-primary">You Go</span>
          </h1>

          <p class="mt-6 text-lg sm:text-xl text-muted max-w-2xl mx-auto leading-relaxed animate-fade-up stagger-2">
            Tide predictions, swell forecasts, wind conditions, and moon phases —
            composited into one smart score that tells you if it's worth heading out.
          </p>

          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
            <UButton to="/dashboard" size="xl" icon="i-lucide-layout-dashboard" class="w-full sm:w-auto">
              Open Dashboard
            </UButton>
            <UButton to="/spots/new" size="xl" variant="outline" icon="i-lucide-map-pin" class="w-full sm:w-auto">
              Add Your First Spot
            </UButton>
          </div>
        </div>
      </div>

      <!-- Decorative wave -->
      <div class="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full text-default" preserveAspectRatio="none">
          <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H0Z" fill="currentColor" />
        </svg>
      </div>
    </section>

    <!-- Features -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-display font-bold text-default">
          Everything You Need at the Coast
        </h2>
        <p class="mt-3 text-muted text-lg max-w-xl mx-auto">
          Whether you're chasing waves or waiting for a bite, TideCheck has your back.
        </p>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(feature, i) in features"
          :key="feature.title"
          class="condition-card p-6 animate-fade-up"
          :class="`stagger-${i + 1}`"
        >
          <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <UIcon :name="feature.icon" class="size-6 text-primary" />
          </div>
          <h3 class="font-display font-semibold text-lg text-default mb-2">
            {{ feature.title }}
          </h3>
          <p class="text-muted text-sm leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="ocean-gradient py-16 sm:py-20">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-display font-bold text-white mb-4">
          Ready to check conditions?
        </h2>
        <p class="text-white/80 text-lg mb-8">
          Add your favorite surf breaks and fishing spots. Get scored conditions in seconds.
        </p>
        <UButton to="/spots/new" size="xl" color="neutral" variant="solid" icon="i-lucide-plus">
          Add Your First Spot
        </UButton>
      </div>
    </section>
  </div>
</template>
