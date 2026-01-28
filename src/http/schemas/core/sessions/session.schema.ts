/**
 * Core Sessions Module Zod Schemas
 * Schemas reutilizáveis para sessões de usuário
 */

import z from 'zod';

// ============= DEVICE INFO SCHEMA =============

export const deviceTypeSchema = z.enum([
  'desktop',
  'mobile',
  'tablet',
  'bot',
  'unknown',
]);

export const deviceInfoSchema = z.object({
  userAgent: z.string().optional(),
  deviceType: deviceTypeSchema,
  deviceName: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  osName: z.string().optional(),
  osVersion: z.string().optional(),
  displayName: z.string(),
  isMobile: z.boolean(),
  isBot: z.boolean(),
});

// ============= GEO LOCATION SCHEMA =============

export const geoLocationSchema = z.object({
  country: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  displayName: z.string(),
  shortName: z.string(),
});

// ============= SESSION SCHEMAS =============

export const loginMethodSchema = z.enum([
  'password',
  'oauth',
  'magic_link',
  'api_key',
]);

/**
 * Schema para resposta de sessão - corresponde ao SessionDTO
 */
export const sessionResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  ip: z.string(),
  createdAt: z.coerce.date(),
  expiredAt: z.coerce.date().nullable().optional(),
  revokedAt: z.coerce.date().nullable().optional(),
  lastUsedAt: z.coerce.date().nullable().optional(),

  // Device Information
  device: deviceInfoSchema,

  // Geolocation
  location: geoLocationSchema,

  // Security & Trust
  isTrusted: z.boolean(),
  trustVerifiedAt: z.coerce.date().nullable().optional(),
  loginMethod: loginMethodSchema.optional(),

  // Computed
  isActive: z.boolean(),
  displayDescription: z.string(),
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionResponseSchema),
});

export const sessionWithUserSchema = sessionResponseSchema.extend({
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    username: z.string(),
  }),
});

// ============= QUERY PARAMS =============

export const sessionQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  userId: z.uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  deviceType: deviceTypeSchema.optional(),
  country: z.string().optional(),
  isTrusted: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const sessionDateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// ============= TRUST MANAGEMENT =============

export const trustSessionSchema = z.object({
  sessionId: z.uuid(),
});

export const untrustSessionSchema = z.object({
  sessionId: z.uuid(),
});
