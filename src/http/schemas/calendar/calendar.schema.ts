import { z } from 'zod';

export const calendarTypeEnum = z.enum(['PERSONAL', 'TEAM', 'SYSTEM']);

export const calendarAccessSchema = z.object({
  canRead: z.boolean(),
  canCreate: z.boolean(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
  canShare: z.boolean(),
});

export const calendarResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  type: z.string(),
  ownerId: z.string().optional().nullable(),
  systemModule: z.string().optional().nullable(),
  isDefault: z.boolean(),
  access: calendarAccessSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const createTeamCalendarSchema = z.object({
  teamId: z.string().uuid(),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
});

export const updateCalendarSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
});

export const teamCalendarPermissionsSchema = z.object({
  ownerCanRead: z.boolean().optional(),
  ownerCanCreate: z.boolean().optional(),
  ownerCanEdit: z.boolean().optional(),
  ownerCanDelete: z.boolean().optional(),
  ownerCanShare: z.boolean().optional(),
  adminCanRead: z.boolean().optional(),
  adminCanCreate: z.boolean().optional(),
  adminCanEdit: z.boolean().optional(),
  adminCanDelete: z.boolean().optional(),
  adminCanShare: z.boolean().optional(),
  memberCanRead: z.boolean().optional(),
  memberCanCreate: z.boolean().optional(),
  memberCanEdit: z.boolean().optional(),
  memberCanDelete: z.boolean().optional(),
  memberCanShare: z.boolean().optional(),
});
