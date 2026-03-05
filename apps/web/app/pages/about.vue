<script setup lang="ts">
useSeo({
  title: 'About TideCheck — How the Go Score Works',
  description: 'Learn how TideCheck calculates Go/No-Go scores by compositing tide phase, wind speed, swell height, moon phase, and barometric pressure into one smart recommendation.',
  ogImage: {
    title: 'About TideCheck',
    description: 'How the Go Score algorithm works',
    icon: 'ℹ️',
  },
})
useWebPageSchema({
  name: 'About TideCheck',
  description: 'Learn how TideCheck calculates Go/No-Go scores for surf and fishing conditions.',
})

const factors = [
  {
    name: 'Tide Phase',
    points: 30,
    icon: 'i-lucide-arrow-up-down',
    description: 'Incoming tides and the first 2 hours of outgoing tide score highest. Dead low or slack high tide receive fewer points since water movement drives feeding activity.',
  },
  {
    name: 'Wind Speed',
    points: 25,
    icon: 'i-lucide-wind',
    description: 'Calm winds under 10 mph are ideal. 10-15 mph is workable. Over 20 mph makes conditions dangerous. Offshore wind (blowing from land to water) gets a surfing bonus for clean wave faces.',
  },
  {
    name: 'Swell Height',
    points: 20,
    icon: 'i-lucide-waves',
    description: 'Context-dependent — 3-6 ft is ideal for surfing, while fishing prefers under 3 ft. Over 8 ft receives a danger penalty. Longer swell periods indicate cleaner, more organized waves.',
  },
  {
    name: 'Moon & Solunar',
    points: 15,
    icon: 'i-lucide-moon',
    description: 'New and full moons create stronger spring tides and earn maximum points. Major solunar feeding periods (when the moon is directly overhead or underfoot) receive additional bonus points.',
  },
  {
    name: 'Barometric Pressure',
    points: 10,
    icon: 'i-lucide-gauge',
    description: 'Falling pressure signals approaching weather and triggers fish feeding activity. Steady or rising pressure indicates stable conditions. This factor weighs more heavily for fishing spots.',
  },
]
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-display font-bold text-default mb-2">
      About TideCheck
    </h1>
    <p class="text-muted text-lg mb-10">
      Your conditions dashboard for smarter time at the coast.
    </p>

    <!-- What is TideCheck -->
    <section class="mb-12">
      <h2 class="text-2xl font-display font-semibold text-default mb-4">
        What is TideCheck?
      </h2>
      <div class="prose-like text-muted space-y-4">
        <p>
          TideCheck composites real-time data from multiple sources — tide predictions, marine forecasts, wind observations, and lunar calculations — into a single "Go Score" that tells you whether it's worth heading out to surf or fish.
        </p>
        <p>
          Instead of checking five different apps and trying to correlate the data yourself, TideCheck does the analysis for you and presents a clear 0-100 score with a detailed breakdown of each factor's contribution.
        </p>
      </div>
    </section>

    <!-- How the Go Score Works -->
    <section class="mb-12">
      <h2 class="text-2xl font-display font-semibold text-default mb-6">
        How the Go Score Works
      </h2>
      <p class="text-muted mb-6">
        The Go Score is a composite of 5 factors totaling 100 points. Each factor is scored independently based on current conditions:
      </p>

      <div class="space-y-4">
        <div v-for="factor in factors" :key="factor.name" class="condition-card p-5">
          <div class="flex items-start gap-4">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UIcon :name="factor.icon" class="size-5 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h3 class="font-display font-semibold text-default">
                  {{ factor.name }}
                </h3>
                <UBadge variant="subtle" size="sm">
                  {{ factor.points }} points
                </UBadge>
              </div>
              <p class="text-sm text-muted leading-relaxed">
                {{ factor.description }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 condition-card p-6">
        <h3 class="font-display font-semibold text-default mb-4">
          Score Ratings
        </h3>
        <div class="grid sm:grid-cols-3 gap-4">
          <div class="text-center p-4 rounded-xl bg-success/10">
            <div class="text-2xl font-display font-bold text-success">
              70-100
            </div>
            <div class="text-sm font-medium text-success mt-1">
              Go! 🟢
            </div>
            <p class="text-xs text-muted mt-2">
              Excellent conditions — head out with confidence
            </p>
          </div>
          <div class="text-center p-4 rounded-xl bg-warning/10">
            <div class="text-2xl font-display font-bold text-warning">
              45-69
            </div>
            <div class="text-sm font-medium text-warning mt-1">
              Maybe 🟡
            </div>
            <p class="text-xs text-muted mt-2">
              Decent conditions — check the factor breakdown
            </p>
          </div>
          <div class="text-center p-4 rounded-xl bg-error/10">
            <div class="text-2xl font-display font-bold text-error">
              0-44
            </div>
            <div class="text-sm font-medium text-error mt-1">
              No-Go 🔴
            </div>
            <p class="text-xs text-muted mt-2">
              Poor conditions — wait for a better window
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Sources -->
    <section class="mb-12">
      <h2 class="text-2xl font-display font-semibold text-default mb-4">
        Data Sources
      </h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="condition-card p-5">
          <h3 class="font-display font-semibold text-default mb-2">
            NOAA CO-OPS
          </h3>
          <p class="text-sm text-muted">
            Tide predictions (high/low and hourly) from the National Ocean Service's Center for Operational Oceanographic Products and Services.
          </p>
        </div>
        <div class="condition-card p-5">
          <h3 class="font-display font-semibold text-default mb-2">
            Open-Meteo
          </h3>
          <p class="text-sm text-muted">
            Marine swell data and weather forecasts (wind, temperature, pressure) from the open-source Open-Meteo weather API.
          </p>
        </div>
      </div>
    </section>

    <!-- Tips -->
    <section>
      <h2 class="text-2xl font-display font-semibold text-default mb-4">
        Tips for Reading Conditions
      </h2>
      <div class="condition-card p-6 space-y-4">
        <div class="flex gap-3">
          <span class="text-lg">🌊</span>
          <p class="text-sm text-muted">
            <strong class="text-default">Incoming tide</strong> is generally best for both surf and fishing. Fish move into shallow areas to feed, and waves clean up as water pushes in.
          </p>
        </div>
        <div class="flex gap-3">
          <span class="text-lg">💨</span>
          <p class="text-sm text-muted">
            <strong class="text-default">Offshore winds</strong> (blowing from land toward water) create clean, glassy wave faces for surfing. For fishing, light winds under 10 mph are ideal.
          </p>
        </div>
        <div class="flex gap-3">
          <span class="text-lg">🌑</span>
          <p class="text-sm text-muted">
            <strong class="text-default">New and full moons</strong> create stronger tidal flows (spring tides), which moves more bait and triggers predator feeding. Plan your fishing around major solunar periods.
          </p>
        </div>
        <div class="flex gap-3">
          <span class="text-lg">📊</span>
          <p class="text-sm text-muted">
            <strong class="text-default">Falling barometric pressure</strong> is one of the strongest fish-feeding triggers. When you see pressure dropping, grab your gear!
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
