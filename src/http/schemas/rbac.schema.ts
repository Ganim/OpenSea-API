/**
 * RBAC Zod Schemas
 * Schemas reutilizáveis para validação de permissões, grupos e associações
 */

import { z } from 'zod';
import { dateSchema, idSchema } from './common.schema';

/**
 * Permission Code Format (1-4 parts):
 * - module (1 part) - ex: stock, sales (menu access)
 * - module.resource (2 parts) - ex: stock.locations, stock.volumes (submenu access)
 * - module.resource.action (3 parts) - ex: stock.products.read, sales.orders.create
 * - module.resource.action.scope (4 parts) - ex: hr.employees.read.all, hr.employees.list.team
 *
 * Wildcards are also supported: stock.*.read, *.products.*, *.*.*
 */
export const permissionCodeSchema = z
  .string()
  .regex(
    /^[a-z][a-z0-9_-]*(\.[a-z*][a-z0-9_-]*){0,3}$/i,
    'Permission code must follow format: module[.resource[.action[.scope]]]',
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
 * Permission Group with Details Schema (includes users and permissions)
 */
export const permissionGroupWithDetailsSchema = z.object({
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
  users: z.array(
    z.object({
      id: idSchema,
      username: z.string(),
      email: z.string().email(),
    }),
  ),
  usersCount: z.number(),
  permissions: z.array(
    z.object({
      id: idSchema,
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      module: z.string(),
      resource: z.string(),
      action: z.string(),
      effect: permissionEffectSchema,
      conditions: z.record(z.string(), z.unknown()).nullable(),
    }),
  ),
  permissionsCount: z.number(),
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
 * Bulk Add Permissions to Group Schema
 * Permite adicionar múltiplas permissões de uma vez (mais eficiente)
 */
export const bulkAddPermissionsToGroupSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionCode: permissionCodeSchema,
        effect: permissionEffectSchema.default('allow'),
        conditions: z.record(z.string(), z.unknown()).nullable().optional(),
      }),
    )
    .min(1, 'At least one permission is required')
    .max(500, 'Maximum 500 permissions per request'),
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

/**
 * Grant Direct Permission to User Schema
 */
export const grantDirectPermissionSchema = z.object({
  permissionId: z.string().uuid(),
  effect: permissionEffectSchema.default('allow'),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  grantedBy: z.string().uuid().nullable().optional(),
});

/**
 * Update Direct Permission Schema
 */
export const updateDirectPermissionSchema = z.object({
  effect: permissionEffectSchema.optional(),
  conditions: z.record(z.string(), z.unknown()).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

/**
 * List User Direct Permissions Query Schema
 */
export const listUserDirectPermissionsQuerySchema = z.object({
  includeExpired: z.coerce.boolean().default(false),
  effect: permissionEffectSchema.optional(),
});

/**
 * Permission By Module Schema
 */
export const permissionByModuleSchema = z.object({
  module: z.string(),
  permissions: z.array(permissionSchema),
  total: z.number(),
});

/**
 * List Permissions By Modules Query Schema
 */
export const listPermissionsByModulesQuerySchema = z.object({
  includeSystem: z
    .union([z.boolean(), z.string()])
    .optional()
    .default(true)
    .transform((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    }),
});
