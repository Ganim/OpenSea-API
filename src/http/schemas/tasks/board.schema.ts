import { z } from 'zod';

export const boardTypeEnum = z.enum(['PERSONAL', 'TEAM']);
export const boardVisibilityEnum = z.enum(['PRIVATE', 'SHARED']);
export const boardViewEnum = z.enum([
  'KANBAN',
  'TABLE',
  'CALENDAR',
  'TIMELINE',
  'DASHBOARD',
]);
export const boardMemberRoleEnum = z.enum(['VIEWER', 'EDITOR']);

export const createBoardSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional().nullable(),
  type: boardTypeEnum.optional().default('PERSONAL'),
  teamId: z.string().uuid().optional().nullable(),
  visibility: boardVisibilityEnum.optional().default('PRIVATE'),
  defaultView: boardViewEnum.optional().default('KANBAN'),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
  gradientId: z.string().max(32).nullable().optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).optional().nullable(),
  visibility: boardVisibilityEnum.optional(),
  defaultView: boardViewEnum.optional(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
  gradientId: z.string().max(32).nullable().optional(),
});

export const listBoardsQuerySchema = z.object({
  type: boardTypeEnum.optional(),
  search: z.string().max(256).optional(),
  includeArchived: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const inviteBoardMemberSchema = z.object({
  userId: z.string().uuid(),
  role: boardMemberRoleEnum.optional().default('VIEWER'),
});

export const updateBoardMemberSchema = z.object({
  role: boardMemberRoleEnum,
});

// Response schemas

export const boardColumnResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  title: z.string(),
  color: z.string().optional().nullable(),
  position: z.number(),
  isDefault: z.boolean(),
  isDone: z.boolean(),
  wipLimit: z.number().optional().nullable(),
  archivedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
});

export const boardLabelResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  position: z.number(),
});

export const boardMemberResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string(),
  userName: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});

export const boardResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional().nullable(),
  type: z.string(),
  teamId: z.string().uuid().optional().nullable(),
  ownerId: z.string().uuid(),
  storageFolderId: z.string().uuid().optional().nullable(),
  gradientId: z.string().max(32).nullable().optional(),
  visibility: z.string(),
  defaultView: z.string(),
  settings: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  position: z.number(),
  columns: z.array(boardColumnResponseSchema).optional(),
  labels: z.array(boardLabelResponseSchema).optional(),
  members: z.array(boardMemberResponseSchema).optional(),
  archivedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});
