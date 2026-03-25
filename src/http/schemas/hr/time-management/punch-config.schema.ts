/**
 * PUNCH CONFIGURATION SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para resposta de configuração de ponto
 */
export const punchConfigResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  selfieRequired: z.boolean(),
  gpsRequired: z.boolean(),
  geofenceEnabled: z.boolean(),
  qrCodeEnabled: z.boolean(),
  directLoginEnabled: z.boolean(),
  kioskModeEnabled: z.boolean(),
  pwaEnabled: z.boolean(),
  offlineAllowed: z.boolean(),
  maxOfflineHours: z.number().int(),
  toleranceMinutes: z.number().int(),
  autoClockOutHours: z.number().int().nullable(),
  pdfReceiptEnabled: z.boolean(),
  defaultRadiusMeters: z.number().int(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para atualização de configuração de ponto
 */
export const updatePunchConfigBodySchema = z.object({
  selfieRequired: z.boolean().optional(),
  gpsRequired: z.boolean().optional(),
  geofenceEnabled: z.boolean().optional(),
  qrCodeEnabled: z.boolean().optional(),
  directLoginEnabled: z.boolean().optional(),
  kioskModeEnabled: z.boolean().optional(),
  pwaEnabled: z.boolean().optional(),
  offlineAllowed: z.boolean().optional(),
  maxOfflineHours: z.number().int().min(1).max(720).optional(),
  toleranceMinutes: z.number().int().min(0).max(60).optional(),
  autoClockOutHours: z.number().int().min(1).max(24).nullable().optional(),
  pdfReceiptEnabled: z.boolean().optional(),
  defaultRadiusMeters: z.number().int().min(50).max(10000).optional(),
});

/**
 * Schema para criação de zona de geofence
 */
export const createGeofenceZoneBodySchema = z.object({
  name: z.string().min(1).max(256).trim(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(10000).optional().default(200),
  isActive: z.boolean().optional().default(true),
  address: z.string().max(512).nullable().optional(),
});

/**
 * Schema para atualização de zona de geofence
 */
export const updateGeofenceZoneBodySchema = z.object({
  name: z.string().min(1).max(256).trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().min(10).max(10000).optional(),
  isActive: z.boolean().optional(),
  address: z.string().max(512).nullable().optional(),
});

/**
 * Schema para resposta de zona de geofence
 */
export const geofenceZoneResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radiusMeters: z.number().int(),
  isActive: z.boolean(),
  address: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para validação de geofence
 */
export const validateGeofenceBodySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/**
 * Schema para resposta de validação de geofence
 */
export const validateGeofenceResponseSchema = z.object({
  isWithinZone: z.boolean(),
  matchedZone: geofenceZoneResponseSchema.nullable(),
  distanceMeters: z.number().nullable(),
});

/**
 * Schema para geração de payload QR Code
 */
export const generateQrPayloadBodySchema = z.object({
  employeeId: idSchema,
});

/**
 * Schema para resposta de payload QR Code
 */
export const qrPayloadResponseSchema = z.object({
  url: z.string(),
  tenantId: idSchema,
  employeeId: idSchema,
  name: z.string(),
  token: z.string(),
  exp: z.number(),
});
