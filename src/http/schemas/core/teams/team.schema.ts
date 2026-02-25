import { z } from 'zod';

export const teamMemberRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER']);

export const createTeamSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(2000).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
    .optional()
    .nullable(),
  avatarUrl: z.string().url().max(512).optional().nullable(),
});

export const updateTeamSchema = createTeamSchema.partial();

export const teamResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  permissionGroupId: z.string().nullable(),
  storageFolderId: z.string().nullable(),
  settings: z.record(z.string(), z.unknown()),
  membersCount: z.number(),
  createdBy: z.string(),
  creatorName: z.string().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const teamMemberResponseSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  role: z.string(),
  joinedAt: z.date(),
  leftAt: z.date().nullable(),
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  userAvatarUrl: z.string().nullable(),
});

export const addTeamMembersSchema = z.object({
  members: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: teamMemberRoleEnum.exclude(['OWNER']).optional(),
      }),
    )
    .min(1)
    .max(50),
});

export const changeTeamMemberRoleSchema = z.object({
  role: teamMemberRoleEnum.exclude(['OWNER']),
});

export const transferOwnershipSchema = z.object({
  userId: z.string().uuid(),
});
