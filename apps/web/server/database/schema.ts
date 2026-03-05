/**
 * TideCheck — App-specific database schema.
 *
 * Re-exports the layer's base tables (users, sessions) so that
 * drizzle-kit can discover them from this workspace.
 */
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export * from '#layer/server/database/schema'

// ─── Spots — User-saved coastal locations ────────────────────
export const spots = sqliteTable('spots', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  noaaStationId: text('noaa_station_id'),
  spotType: text('spot_type').notNull(), // 'surf' | 'fishing' | 'both'
  description: text('description'),
  timezone: text('timezone').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
})

// ─── Sessions — Logged surf/fishing sessions ────────────────
export const surfSessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  spotId: text('spot_id').notNull().references(() => spots.id, { onDelete: 'cascade' }),
  sessionType: text('session_type').notNull(), // 'surf' | 'fishing'
  date: text('date').notNull(), // ISO date
  rating: integer('rating'), // 1-5
  notes: text('notes'),
  conditionsSnapshot: text('conditions_snapshot'), // JSON blob
  catchCount: integer('catch_count'),
  createdAt: integer('created_at').notNull(),
})

// ─── Alerts — Condition-based notifications ──────────────────
export const alerts = sqliteTable('alerts', {
  id: text('id').primaryKey(),
  spotId: text('spot_id').notNull().references(() => spots.id, { onDelete: 'cascade' }),
  alertType: text('alert_type').notNull(), // 'ideal_tide' | 'low_wind' | 'swell_threshold'
  thresholdJson: text('threshold_json').notNull(),
  isActive: integer('is_active').notNull().default(1),
  createdAt: integer('created_at').notNull(),
})

// ─── API Cache — Cache external API responses ────────────────
export const apiCache = sqliteTable('api_cache', {
  key: text('key').primaryKey(),
  data: text('data').notNull(),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
})

// ─── Type helpers ────────────────────────────────────────────
export type Spot = typeof spots.$inferSelect
export type NewSpot = typeof spots.$inferInsert
export type SurfSession = typeof surfSessions.$inferSelect
export type NewSurfSession = typeof surfSessions.$inferInsert
export type Alert = typeof alerts.$inferSelect
export type NewAlert = typeof alerts.$inferInsert
