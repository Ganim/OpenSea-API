import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const setFolderAccessSchema = z
  .object({
    userId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canShare: z.boolean().default(false),
  })
  .refine((accessRule) => accessRule.userId || accessRule.groupId, {
    message: 'Either userId or groupId must be provided',
    path: ['userId'],
  })
  .refine((accessRule) => !(accessRule.userId && accessRule.groupId), {
    message: 'Only one of userId or groupId can be provided, not both',
    path: ['groupId'],
  });

// ============================================================================
// Response Schemas
// ============================================================================

export const folderAccessRuleResponseSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  userName: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  groupName: z.string().optional().nullable(),
  canRead: z.boolean(),
  canWrite: z.boolean(),
  canDelete: z.boolean(),
  canShare: z.boolean(),
  grantedBy: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// Types
// ============================================================================

export type SetFolderAccessInput = z.infer<typeof setFolderAccessSchema>;
export type FolderAccessRuleResponse = z.infer<
  typeof folderAccessRuleResponseSchema
>;
