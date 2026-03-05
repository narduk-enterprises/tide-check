import { calculateMoonPhase } from '#server/utils/moonPhase'

/**
 * GET /api/moon
 * Return current moon phase, illumination, solunar periods.
 * Pure calculation — no external API needed.
 */
export default defineEventHandler(() => {
  return calculateMoonPhase(new Date())
})
