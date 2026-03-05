/**
 * Go Score — composite conditions scoring algorithm.
 *
 * Factors (100 points total):
 *   Tide phase:     30 points
 *   Wind:           25 points
 *   Swell:          20 points
 *   Moon/Solunar:   15 points
 *   Pressure:       10 points
 */

export interface ScoreBreakdown {
  total: number
  rating: 'go' | 'maybe' | 'no-go'
  factors: {
    tide: { score: number; max: 30; details: string }
    wind: { score: number; max: 25; details: string }
    swell: { score: number; max: 20; details: string }
    moon: { score: number; max: 15; details: string }
    pressure: { score: number; max: 10; details: string }
  }
}

interface TideData {
  type: 'rising' | 'falling' | 'high' | 'low'
  hoursFromTurn: number // hours since last tide turn
  currentLevel?: number
}

interface WindData {
  speedMph: number
  gustMph: number
  directionDeg: number
  isOffshore?: boolean // relative to spot orientation
}

interface SwellData {
  heightFt: number
  periodSec: number
  directionDeg: number
}

interface PressureData {
  currentMb: number
  trend: 'rising' | 'falling' | 'steady'
}

export interface ConditionsInput {
  spotType: 'surf' | 'fishing' | 'both'
  tide: TideData
  wind: WindData
  swell: SwellData
  pressure: PressureData
  moonScore: { score: number; details: string }
}

/**
 * Calculate the Go Score for given conditions.
 */
export function calculateGoScore(input: ConditionsInput): ScoreBreakdown {
  const tideResult = scoreTide(input.tide)
  const windResult = scoreWind(input.wind, input.spotType)
  const swellResult = scoreSwell(input.swell, input.spotType)
  const pressureResult = scorePressure(input.pressure, input.spotType)

  const total = tideResult.score + windResult.score + input.moonScore.score + swellResult.score + pressureResult.score

  let rating: 'go' | 'maybe' | 'no-go'
  if (total >= 70) rating = 'go'
  else if (total >= 45) rating = 'maybe'
  else rating = 'no-go'

  return {
    total,
    rating,
    factors: {
      tide: { score: tideResult.score, max: 30, details: tideResult.details },
      wind: { score: windResult.score, max: 25, details: windResult.details },
      swell: { score: swellResult.score, max: 20, details: swellResult.details },
      moon: { score: input.moonScore.score, max: 15, details: input.moonScore.details },
      pressure: { score: pressureResult.score, max: 10, details: pressureResult.details },
    },
  }
}

function scoreTide(tide: TideData): { score: number; details: string } {
  // Incoming tide and first 2 hours of outgoing = max points
  if (tide.type === 'rising') {
    return { score: 30, details: 'Incoming tide — ideal conditions' }
  }
  if (tide.type === 'falling' && tide.hoursFromTurn <= 2) {
    return { score: 25, details: 'First 2 hours of outgoing — still good' }
  }
  if (tide.type === 'falling') {
    return { score: 15, details: 'Outgoing tide — declining conditions' }
  }
  if (tide.type === 'high') {
    return { score: 18, details: 'High tide — slack water' }
  }
  // Low tide
  return { score: 10, details: 'Low tide — limited activity' }
}

function scoreWind(wind: WindData, spotType: string): { score: number; details: string } {
  const speed = wind.speedMph
  let score = 0
  let details = ''

  if (speed < 5) {
    score = 25
    details = `Light winds (${speed} mph) — perfect`
  }
  else if (speed < 10) {
    score = 22
    details = `Mild winds (${speed} mph) — very good`
  }
  else if (speed <= 15) {
    score = 15
    details = `Moderate winds (${speed} mph) — acceptable`
  }
  else if (speed <= 20) {
    score = 8
    details = `Strong winds (${speed} mph) — challenging`
  }
  else {
    score = 0
    details = `Dangerous winds (${speed} mph) — not recommended`
  }

  // Offshore wind bonus for surfing
  if (wind.isOffshore && (spotType === 'surf' || spotType === 'both') && speed <= 15) {
    score = Math.min(25, score + 5)
    details += ' (offshore bonus)'
  }

  // Gust penalty
  if (wind.gustMph > speed * 1.5 && wind.gustMph > 15) {
    score = Math.max(0, score - 3)
    details += ` — gusty (${wind.gustMph} mph gusts)`
  }

  return { score, details }
}

function scoreSwell(swell: SwellData, spotType: string): { score: number; details: string } {
  const height = swell.heightFt
  let score = 0
  let details = ''

  if (spotType === 'surf' || spotType === 'both') {
    // Surfing: 3-6ft ideal
    if (height >= 3 && height <= 6) {
      score = 20
      details = `${height}ft swell — ideal for surfing`
    }
    else if (height >= 2 && height < 3) {
      score = 14
      details = `${height}ft swell — rideable but small`
    }
    else if (height > 6 && height <= 8) {
      score = 15
      details = `${height}ft swell — overhead, experienced surfers`
    }
    else if (height > 8) {
      score = 5
      details = `${height}ft swell — dangerous, experts only`
    }
    else {
      score = 8
      details = `${height}ft swell — too small for surfing`
    }
  }
  else {
    // Fishing: calm waters preferred
    if (height < 2) {
      score = 20
      details = `${height}ft swell — calm, perfect for fishing`
    }
    else if (height < 3) {
      score = 16
      details = `${height}ft swell — moderate, fishable`
    }
    else if (height < 5) {
      score = 10
      details = `${height}ft swell — choppy, difficult`
    }
    else {
      score = 3
      details = `${height}ft swell — too rough for fishing`
    }
  }

  // Period bonus
  if (swell.periodSec >= 10) {
    score = Math.min(20, score + 2)
    details += ` (${swell.periodSec}s period — clean)`
  }

  return { score, details }
}

function scorePressure(pressure: PressureData, spotType: string): { score: number; details: string } {
  let score = 5 // base
  let details = ''

  if (pressure.trend === 'falling') {
    if (spotType === 'fishing' || spotType === 'both') {
      score = 10
      details = `${pressure.currentMb} mb, falling — fish feeding actively`
    }
    else {
      score = 7
      details = `${pressure.currentMb} mb, falling — weather changing`
    }
  }
  else if (pressure.trend === 'steady') {
    score = 6
    details = `${pressure.currentMb} mb, steady — stable conditions`
  }
  else {
    score = 5
    details = `${pressure.currentMb} mb, rising — conditions improving`
  }

  return { score, details }
}

/**
 * Get a rating color class for the Go Score based on the rating.
 */
export function getScoreColor(total: number): string {
  if (total >= 70) return 'success'
  if (total >= 45) return 'warning'
  return 'error'
}
