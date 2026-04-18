import { z } from 'zod';

/**
 * Zod schemas dos endpoints de PunchDevice. Named schemas (ADR-017):
 * exports nomeados, nenhum default export.
 *
 * IMPORTANT — Pitfall 5 / T-04-01: `pairingSecret` aparece EXCLUSIVAMENTE
 * na resposta de `register` (retorno one-time) e `deviceToken` apenas na
 * resposta de `pair`. Qualquer outro schema (list, params) NÃO deve
 * mencioná-los.
 */

export const punchDeviceKindEnum = z.enum([
  'PWA_PERSONAL',
  'KIOSK_PUBLIC',
  'BIOMETRIC_READER',
  'WEBAUTHN_PC',
]);

export const punchDeviceStatusEnum = z.enum(['ONLINE', 'OFFLINE', 'ERROR']);

// ────────────────────────────────────────────────────────────────────
// REGISTER
// ────────────────────────────────────────────────────────────────────

export const registerPunchDeviceBodySchema = z.object({
  name: z.string().min(1).max(128),
  deviceKind: punchDeviceKindEnum,
  geofenceZoneId: z.string().uuid().optional(),
  allowedEmployeeIds: z.array(z.string().uuid()).max(1000).optional(),
  allowedDepartmentIds: z.array(z.string().uuid()).max(500).optional(),
});

export const registerPunchDeviceResponseSchema = z.object({
  deviceId: z.string().uuid(),
  // ONE-TIME — subsequent reads redact this field.
  pairingSecret: z.string().length(64),
});

// ────────────────────────────────────────────────────────────────────
// GET PAIRING CODE
// ────────────────────────────────────────────────────────────────────

export const punchDeviceParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getPunchDevicePairingCodeResponseSchema = z.object({
  code: z.string().length(6),
  expiresAt: z.string(),
});

// ────────────────────────────────────────────────────────────────────
// PAIR
// ────────────────────────────────────────────────────────────────────

export const pairPunchDeviceBodySchema = z.object({
  pairingCode: z.string().min(6).max(6),
  hostname: z.string().min(1).max(128),
});

export const pairPunchDeviceResponseSchema = z.object({
  // ONE-TIME token — client stores and sends in x-punch-device-token header.
  deviceToken: z.string().length(64),
  deviceId: z.string().uuid(),
  deviceName: z.string(),
});

// ────────────────────────────────────────────────────────────────────
// UNPAIR
// ────────────────────────────────────────────────────────────────────

export const unpairPunchDeviceBodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export const unpairPunchDeviceResponseSchema = z.object({
  success: z.literal(true),
});

// ────────────────────────────────────────────────────────────────────
// LIST
// ────────────────────────────────────────────────────────────────────

export const listPunchDevicesQuerySchema = z.object({
  deviceKind: punchDeviceKindEnum.optional(),
  status: punchDeviceStatusEnum.optional(),
  includeRevoked: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const punchDeviceDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  deviceKind: punchDeviceKindEnum,
  deviceLabel: z.string().nullable(),
  geofenceZoneId: z.string().nullable(),
  isPaired: z.boolean(),
  status: punchDeviceStatusEnum,
  pairedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  ipAddress: z.string().nullable(),
  hostname: z.string().nullable(),
  version: z.string().nullable(),
  createdAt: z.string(),
});

export const listPunchDevicesResponseSchema = z.object({
  items: z.array(punchDeviceDtoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

// ────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────

export const deletePunchDeviceResponseSchema = z.object({
  success: z.literal(true),
});
