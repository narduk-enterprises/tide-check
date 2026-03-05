/**
 * Moon phase calculation using the synodic period (29.53 days).
 * No external API needed — pure math.
 */

const SYNODIC_PERIOD = 29.53058770576
// Known new moon reference: Jan 6, 2000 18:14 UTC
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime()

export interface MoonData {
  phase: string
  phaseName: string
  illumination: number
  age: number // days into cycle
  emoji: string
  isWaxing: boolean
  // Solunar periods
  majorPeriods: { start: string; end: string }[]
  minorPeriods: { start: string; end: string }[]
}

/**
 * Calculate moon phase for a given date.
 */
export function calculateMoonPhase(date: Date = new Date()): MoonData {
  const diffMs = date.getTime() - KNOWN_NEW_MOON
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  const age = ((diffDays % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD

  const fraction = age / SYNODIC_PERIOD
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * fraction)) / 2 * 100)
  const isWaxing = fraction < 0.5

  let phase: string
  let phaseName: string
  let emoji: string

  if (fraction < 0.0625) {
    phase = 'new'
    phaseName = 'New Moon'
    emoji = '🌑'
  }
  else if (fraction < 0.1875) {
    phase = 'waxing-crescent'
    phaseName = 'Waxing Crescent'
    emoji = '🌒'
  }
  else if (fraction < 0.3125) {
    phase = 'first-quarter'
    phaseName = 'First Quarter'
    emoji = '🌓'
  }
  else if (fraction < 0.4375) {
    phase = 'waxing-gibbous'
    phaseName = 'Waxing Gibbous'
    emoji = '🌔'
  }
  else if (fraction < 0.5625) {
    phase = 'full'
    phaseName = 'Full Moon'
    emoji = '🌕'
  }
  else if (fraction < 0.6875) {
    phase = 'waning-gibbous'
    phaseName = 'Waning Gibbous'
    emoji = '🌖'
  }
  else if (fraction < 0.8125) {
    phase = 'last-quarter'
    phaseName = 'Last Quarter'
    emoji = '🌗'
  }
  else if (fraction < 0.9375) {
    phase = 'waning-crescent'
    phaseName = 'Waning Crescent'
    emoji = '🌘'
  }
  else {
    phase = 'new'
    phaseName = 'New Moon'
    emoji = '🌑'
  }

  // Solunar periods — based on moon transit (overhead/underfoot)
  // Major periods: ~2h centered on moon transit (overhead) and moon opposition (underfoot)
  // Minor periods: ~1h centered on moonrise and moonset
  // Simplified calculation based on moon age
  const transitHour = (age * 24 / SYNODIC_PERIOD * 0.97 + 12) % 24
  const oppositionHour = (transitHour + 12) % 24
  const moonriseHour = (transitHour - 6 + 24) % 24
  const moonsetHour = (transitHour + 6) % 24

  const majorPeriods = [
    formatPeriod(transitHour, 1),
    formatPeriod(oppositionHour, 1),
  ]

  const minorPeriods = [
    formatPeriod(moonriseHour, 0.5),
    formatPeriod(moonsetHour, 0.5),
  ]

  return {
    phase,
    phaseName,
    illumination,
    age: Math.round(age * 10) / 10,
    emoji,
    isWaxing,
    majorPeriods,
    minorPeriods,
  }
}

function formatPeriod(centerHour: number, halfDurationHours: number): { start: string; end: string } {
  const startHour = (centerHour - halfDurationHours + 24) % 24
  const endHour = (centerHour + halfDurationHours) % 24
  return {
    start: formatTime(startHour),
    end: formatTime(endHour),
  }
}

function formatTime(decimalHour: number): string {
  const h = Math.floor(decimalHour)
  const m = Math.round((decimalHour - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Get moon score for the scoring algorithm.
 * New/full moon = stronger tides = more points.
 * Major feeding periods = bonus.
 */
export function getMoonScore(date: Date = new Date()): { score: number; details: string } {
  const moon = calculateMoonPhase(date)
  let score = 0

  // New and full moons create stronger tides (spring tides)
  if (moon.phase === 'new' || moon.phase === 'full') {
    score = 15
  }
  else if (moon.phase === 'first-quarter' || moon.phase === 'last-quarter') {
    score = 7 // Neap tides — weaker
  }
  else if (moon.phase === 'waxing-gibbous' || moon.phase === 'waning-gibbous') {
    score = 12
  }
  else {
    score = 9 // Crescent phases
  }

  // Check if current time is in a feeding period
  const hourNow = date.getHours() + date.getMinutes() / 60
  const inMajor = moon.majorPeriods.some(p => isInPeriod(hourNow, p.start, p.end))
  const inMinor = moon.minorPeriods.some(p => isInPeriod(hourNow, p.start, p.end))

  if (inMajor) {
    score = Math.min(15, score + 3)
  }
  else if (inMinor) {
    score = Math.min(15, score + 1)
  }

  return {
    score,
    details: `${moon.phaseName} ${moon.emoji} (${moon.illumination}% illumination)${inMajor ? ' — Major feeding period' : inMinor ? ' — Minor feeding period' : ''}`,
  }
}

function isInPeriod(hourNow: number, startStr: string, endStr: string): boolean {
  const start = parseTime(startStr)
  const end = parseTime(endStr)
  if (start <= end) {
    return hourNow >= start && hourNow <= end
  }
  // Wraps around midnight
  return hourNow >= start || hourNow <= end
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h! + m! / 60
}
