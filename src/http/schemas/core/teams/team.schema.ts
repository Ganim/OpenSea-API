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
  avatarUrl: z.string().max(512).optional().nullable(),
  emailAccountId: z.string().uuid().optional().nullable(),
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
  emailAccountId: z.string().nullable(),
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

// Team Email Account schemas
export const teamEmailAccountResponseSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  accountId: z.string(),
  accountAddress: z.string().optional(),
  accountDisplayName: z.string().nullable().optional(),
  ownerCanRead: z.boolean(),
  ownerCanSend: z.boolean(),
  ownerCanManage: z.boolean(),
  adminCanRead: z.boolean(),
  adminCanSend: z.boolean(),
  adminCanManage: z.boolean(),
  memberCanRead: z.boolean(),
  memberCanSend: z.boolean(),
  memberCanManage: z.boolean(),
  linkedBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const linkTeamEmailSchema = z.object({
  accountId: z.string().uuid(),
  ownerCanRead: z.boolean().default(true),
  ownerCanSend: z.boolean().default(true),
  ownerCanManage: z.boolean().default(true),
  adminCanRead: z.boolean().default(true),
  adminCanSend: z.boolean().default(true),
  adminCanManage: z.boolean().default(false),
  memberCanRead: z.boolean().default(true),
  memberCanSend: z.boolean().default(false),
  memberCanManage: z.boolean().default(false),
});

export const updateTeamEmailPermissionsSchema = z.object({
  ownerCanRead: z.boolean().optional(),
  ownerCanSend: z.boolean().optional(),
  ownerCanManage: z.boolean().optional(),
  adminCanRead: z.boolean().optional(),
  adminCanSend: z.boolean().optional(),
  adminCanManage: z.boolean().optional(),
  memberCanRead: z.boolean().optional(),
  memberCanSend: z.boolean().optional(),
  memberCanManage: z.boolean().optional(),
});
