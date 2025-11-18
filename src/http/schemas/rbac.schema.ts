/**
 * RBAC Zod Schemas
 * Schemas reutilizáveis para validação de permissões, grupos e associações
 */

import { z } from 'zod';
import { dateSchema, idSchema } from './common.schema';

/**
 * Permission Code Format: module.resource.action
 * Examples: stock.products.read, sales.orders.create
 */
export const permissionCodeSchema = z
  .string()
  .regex(
    /^[a-z]+\.[a-z-]+\.(read|create|update|delete|manage|\*)$/,
    'Permission code must follow format: module.resource.action',
  );

/**
 * Permission Effect
 */
export const permissionEffectSchema = z.enum(['allow', 'deny']);

/**
 * Permission Entity Schema
 */
export const permissionSchema = z.object({
  id: idSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  module: z.string(),
  resource: z.string(),
  action: z.string(),
  isSystem: z.boolean(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
});

/**
 * Create Permission Schema
 */
export const createPermissionSchema = z.object({
  code: permissionCodeSchema,
  name: z.string().min(3).max(100),
  description: z.string().max(500).nullable().optional(),
  module: z.string().min(2).max(50),
  resource: z.string().min(2).max(50),
  action: z.string().min(2).max(50),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

/**
 * Update Permission Schema
 */
export const updatePermissionSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * List Permissions Query Schema
 */
export const listPermissionsQuerySchema = z.object({
  module: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  isSystem: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Permission Group Entity Schema
 */
export const permissionGroupSchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  priority: z.number(),
  isActive: z.boolean(),
  isSystem: z.boolean(),
  parentId: idSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema.optional(),
  deletedAt: dateSchema.nullable().optional(),
});

/**
 * Create Permission Group Schema
 */
export const createPermissionGroupSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional(),
  priority: z.number().int().min(0).max(1000).default(100),
  parentId: z.string().uuid().nullable().optional(),
});

/**
 * Update Permission Group Schema
 */
export const updatePermissionGroupSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .nullable()
    .optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

/**
 * List Permission Groups Query Schema
 */
export const listPermissionGroupsQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  isSystem: z.coerce.boolean().optional(),
  includeDeleted: z.coerce.boolean().default(false),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Add Permission to Group Schema
 */
export const addPermissionToGroupSchema = z.object({
  permissionCode: permissionCodeSchema,
  effect: permissionEffectSchema.default('allow'),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
});

/**
 * Assign Group to User Schema
 */
export const assignGroupToUserSchema = z.object({
  groupId: z.string().uuid(),
  expiresAt: z.coerce.date().nullable().optional(),
  grantedBy: z.string().uuid().nullable().optional(),
});

/**
 * List User Groups Query Schema
 */
export const listUserGroupsQuerySchema = z.object({
  includeExpired: z.coerce.boolean().default(false),
  includeInactive: z.coerce.boolean().default(false),
});

/**
 * List Users by Group Query Schema
 */
export const listUsersByGroupQuerySchema = z.object({
  includeExpired: z.coerce.boolean().default(false),
});

/**
 * Delete Permission Group Query Schema
 */
export const deletePermissionGroupQuerySchema = z.object({
  force: z.coerce.boolean().default(false),
});

/**
 * Permission with Effect Schema (for group permissions)
 */
export const permissionWithEffectSchema = permissionSchema.extend({
  effect: z.string(),
  conditions: z.record(z.string(), z.unknown()).nullable(),
});

/**
 * User Permission Group Assignment Schema
 */
export const userPermissionGroupSchema = z.object({
  userId: idSchema,
  groupId: idSchema,
  assignedAt: dateSchema,
  expiresAt: dateSchema.nullable(),
  grantedBy: idSchema.nullable(),
});
