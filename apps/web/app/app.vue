<script setup lang="ts">
const route = useRoute()
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Color Mode types depend on build-time module resolution
const colorMode = useColorMode() as any

const colorModeIcon = computed(() => {
  if (colorMode.preference === 'system') return 'i-lucide-monitor'
  return colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'
})

function cycleColorMode() {
  const modes = ['system', 'light', 'dark'] as const
  const idx = modes.indexOf(colorMode.preference as (typeof modes)[number])
  colorMode.preference = modes[(idx + 1) % modes.length]!
}

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: 'Spots', to: '/spots/new', icon: 'i-lucide-map-pin' },
  { label: 'Sessions', to: '/sessions', icon: 'i-lucide-notebook-pen' },
  { label: 'About', to: '/about', icon: 'i-lucide-info' },
]

const mobileMenuOpen = ref(false)

watch(route, () => {
  mobileMenuOpen.value = false
})

function isActivePath(itemTo: string) {
  return route.path.startsWith(itemTo.split('/').slice(0, 2).join('/'))
}

const { loggedIn, user, clear } = useUserSession()
</script>

<template>
  <UApp>
    <ULink
      to="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >Skip to content</ULink
    >
    <div class="app-shell min-h-screen flex flex-col">
      <!-- Header -->
      <div
        role="navigation"
        class="sticky top-0 z-50 border-b border-default bg-default/80 backdrop-blur-xl"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2.5 group">
            <div
              class="size-9 rounded-xl ocean-gradient flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
            >
              <UIcon name="i-lucide-waves" class="size-5" />
            </div>
            <span class="font-display font-bold text-lg tracking-tight">TideCheck</span>
          </NuxtLink>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="
                isActivePath(item.to)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-default hover:bg-elevated'
              "
            >
              {{ item.label }}
            </NuxtLink>
          </div>

          <div class="flex items-center gap-2">
            <template v-if="loggedIn">
              <span class="text-sm font-medium text-muted hidden lg:block">{{
                (user as any)?.email
              }}</span>
              <UButton variant="ghost" color="neutral" size="sm" @click="clear">Logout</UButton>
            </template>
            <template v-else>
              <UButton variant="ghost" color="neutral" to="/login" size="sm">Sign In</UButton>
              <UButton
                variant="solid"
                color="primary"
                to="/register"
                size="sm"
                class="hidden sm:inline-flex"
                >Sign Up</UButton
              >
            </template>
            <UButton
              :icon="colorModeIcon"
              variant="ghost"
              color="neutral"
              aria-label="Toggle color mode"
              @click="cycleColorMode"
            />

            <!-- Mobile hamburger -->
            <UButton
              color="neutral"
              variant="ghost"
              class="md:hidden"
              aria-label="Toggle navigation menu"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <UIcon :name="mobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'" class="size-5" />
            </UButton>
          </div>
        </div>

        <!-- Mobile nav -->
        <Transition name="slide-down">
          <div v-if="mobileMenuOpen" class="md:hidden border-t border-default px-4 py-3 space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
              :class="
                route.path.startsWith(item.to)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted hover:text-default hover:bg-elevated'
              "
            >
              <UIcon :name="item.icon" class="size-4" />
              {{ item.label }}
            </NuxtLink>
          </div>
        </Transition>
      </div>

      <!-- Main -->
      <div id="main-content" class="flex-1">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

      <!-- Footer -->
      <div class="border-t border-default py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <div
                class="size-6 rounded-lg ocean-gradient flex items-center justify-center text-white"
              >
                <UIcon name="i-lucide-waves" class="size-3.5" />
              </div>
              <span class="font-display font-semibold text-sm">TideCheck</span>
            </div>
            <p class="text-sm text-muted text-center">
              Tide data: NOAA CO-OPS &middot; Marine forecasts: Open-Meteo &middot;
              <NuxtTime :datetime="new Date()" year="numeric" />
            </p>
          </div>
        </div>
      </div>
    </div>
  </UApp>
</template>

<style>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
