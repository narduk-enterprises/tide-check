<script setup lang="ts">
useSeo({
  title: 'Add a Spot — Save Your Favorite Location',
  description: 'Add a surf break, fishing pier, or coastal spot to TideCheck. Auto-detect the nearest NOAA tide station and start tracking conditions.',
  ogImage: {
    title: 'Add a Spot to TideCheck',
    description: 'Track conditions at your favorite coastal location',
    icon: '📍',
  },
})
useWebPageSchema({
  name: 'Add a Spot — TideCheck',
  description: 'Add a surf break, fishing pier, or coastal spot to TideCheck.',
})

const router = useRouter()

function onMapClick(coords: { lat: number; lng: number }) {
  form.latitude = String(coords.lat)
  form.longitude = String(coords.lng)
}

function createMapPin() {
  const el = document.createElement('div')
  el.className = `size-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary text-white text-xs`
  el.innerHTML = '📍'
  return { element: el }
}

const mapItems = computed(() => {
  if (form.latitude && form.longitude) {
    return [{ id: 'new-spot', lat: Number(form.latitude), lng: Number(form.longitude) }]
  }
  return []
})

const form = reactive({
  name: '',
  latitude: '',
  longitude: '',
  noaaStationId: '',
  spotType: 'both' as 'surf' | 'fishing' | 'both',
  description: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
})

const submitting = ref(false)
const errorMsg = ref('')
const searchingStation = ref(false)

// Popular preset spots for quick add
const presets = [
  { name: 'Galveston Jetty', lat: 29.3013, lon: -94.7835, station: '8771450', tz: 'America/Chicago' },
  { name: 'South Padre Island', lat: 26.0683, lon: -97.1681, station: '8779770', tz: 'America/Chicago' },
  { name: 'Rockport Pier', lat: 28.0306, lon: -97.0469, station: '8774770', tz: 'America/Chicago' },
  { name: 'Port Aransas', lat: 27.8256, lon: -97.0611, station: '8775237', tz: 'America/Chicago' },
  { name: 'Huntington Beach', lat: 33.6595, lon: -117.9988, station: '9410660', tz: 'America/Los_Angeles' },
  { name: 'Outer Banks, NC', lat: 35.5705, lon: -75.4668, station: '8651370', tz: 'America/New_York' },
]

function applyPreset(preset: typeof presets[0]) {
  form.name = preset.name
  form.latitude = String(preset.lat)
  form.longitude = String(preset.lon)
  form.noaaStationId = preset.station
  form.timezone = preset.tz
}

async function findStation() {
  if (!form.latitude || !form.longitude) return
  searchingStation.value = true
  try {
    // Use NOAA metadata API to find nearest station
    const url = `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=english`
    const response = await fetch(url)
    if (!response.ok) return

    interface NoaaStation { id: string; name: string; lat: number; lng: number }
    const data = (await response.json()) as { stations?: NoaaStation[] }
    const stations = (data.stations || []) as NoaaStation[]
    const lat = Number.parseFloat(form.latitude)
    const lon = Number.parseFloat(form.longitude)

    // Find closest station
    let closest: NoaaStation | null = null
    let minDist = Infinity

    for (const station of stations) {
      const dist = Math.sqrt(
        Math.pow(station.lat - lat, 2) + Math.pow(station.lng - lon, 2),
      )
      if (dist < minDist) {
        minDist = dist
        closest = station
      }
    }

    if (closest) {
      form.noaaStationId = closest.id
    }
  }
  catch {
    // Silently fail — user can enter manually
  }
  finally {
    searchingStation.value = false
  }
}

async function submitForm() {
  errorMsg.value = ''
  if (!form.name || !form.latitude || !form.longitude) {
    errorMsg.value = 'Name, latitude, and longitude are required.'
    return
  }

  submitting.value = true
  try {
    const { createSpot } = useSpots()
    const spot = await createSpot({
      name: form.name,
      latitude: Number.parseFloat(form.latitude),
      longitude: Number.parseFloat(form.longitude),
      noaaStationId: form.noaaStationId || null,
      spotType: form.spotType as 'surf' | 'fishing' | 'both',
      description: form.description || null,
      timezone: 'America/Los_Angeles', // TODO: user preference or detect from coords
    })
    await router.push(`/spots/${(spot as { id: string }).id}`)
  }
  catch (err) {
    errorMsg.value = (err as { data?: { message?: string } })?.data?.message || 'Failed to create spot'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <NuxtLink to="/" class="text-sm text-muted hover:text-default transition-colors flex items-center gap-1 mb-6">
      <UIcon name="i-lucide-arrow-left" class="size-3.5" />
      Map
    </NuxtLink>

    <h1 class="text-3xl font-display font-bold text-default mb-2">
      Add a Spot
    </h1>
    <p class="text-muted mb-8">
      Save a coastal location to start tracking conditions.
    </p>

    <!-- Quick Presets -->
    <div class="mb-8">
      <h2 class="text-sm font-medium text-muted mb-3">
        Quick Add — Popular Spots
      </h2>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="preset in presets"
          :key="preset.name"
          variant="outline"
          color="neutral"
          size="sm"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </UButton>
      </div>
    </div>

    <USeparator class="my-6" />

    <!-- Form -->
    <div class="form-section">
      <UAlert v-if="errorMsg" color="error" :title="errorMsg" icon="i-lucide-alert-circle" />

      <UFormField label="Spot Name" required>
        <UInput v-model="form.name" placeholder="e.g. Galveston Jetty" class="w-full" />
      </UFormField>

      <div class="form-row">
        <UFormField label="Latitude" required>
          <UInput v-model="form.latitude" type="number" step="any" placeholder="29.3013" class="w-full" />
        </UFormField>
        <UFormField label="Longitude" required>
          <UInput v-model="form.longitude" type="number" step="any" placeholder="-94.7835" class="w-full" />
        </UFormField>
      </div>

      <div class="my-4 rounded-xl overflow-hidden border border-default shadow-card bg-muted/30 relative h-[300px]">
        <AppMapKit
          :items="mapItems"
          :fallback-center="{ lat: 39.8283, lng: -98.5795 }"
          :zoom-span="{ lat: 20, lng: 20 }"
          :create-pin-element="createMapPin"
          class="w-full h-full"
          @map-click="onMapClick"
        />
      </div>

      <div class="form-row">
        <UFormField label="NOAA Station ID">
          <div class="flex gap-2 w-full">
            <UInput v-model="form.noaaStationId" placeholder="Auto-detected or manual" class="flex-1" />
            <UButton variant="outline" color="neutral" :loading="searchingStation" icon="i-lucide-search" @click="findStation">
              Find
            </UButton>
          </div>
        </UFormField>
        <UFormField label="Timezone">
          <UInput v-model="form.timezone" class="w-full" />
        </UFormField>
      </div>

      <UFormField label="Spot Type">
        <USelect
          v-model="form.spotType"
          :items="[
            { label: 'Surf & Fishing', value: 'both' },
            { label: 'Surf Only', value: 'surf' },
            { label: 'Fishing Only', value: 'fishing' },
          ]"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Description (optional)">
        <UTextarea v-model="form.description" placeholder="Notes about this spot..." :rows="3" class="w-full" />
      </UFormField>

      <div class="form-actions">
        <UButton variant="outline" color="neutral" to="/">
          Cancel
        </UButton>
        <UButton :loading="submitting" icon="i-lucide-plus" @click="submitForm">
          Add Spot
        </UButton>
      </div>
    </div>
  </div>
</template>
