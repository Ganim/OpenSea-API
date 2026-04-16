import { z } from 'zod';

export const oneOnOneStatusSchema = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
]);

export const createOneOnOneMeetingBodySchema = z.object({
  reportId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
});

export const listOneOnOneMeetingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
  status: oneOnOneStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  role: z.enum(['MANAGER', 'REPORT', 'ANY']).optional(),
});

export const updateOneOnOneMeetingBodySchema = z
  .object({
    scheduledAt: z.coerce.date().optional(),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    status: oneOnOneStatusSchema.optional(),
    sharedNotes: z.string().max(8192).nullish(),
    privateNotes: z.string().max(8192).nullish(),
    cancelledReason: z.string().max(255).nullish(),
  })
  .refine(
    (value) => Object.values(value).some((current) => current !== undefined),
    { message: 'Pelo menos um campo deve ser informado' },
  );

export const oneOnOneMeetingIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const oneOnOneMeetingResponseSchema = z.object({
  id: z.string(),
  managerId: z.string(),
  reportId: z.string(),
  scheduledAt: z.date(),
  durationMinutes: z.number(),
  status: oneOnOneStatusSchema,
  privateNotesManager: z.string().nullable(),
  privateNotesReport: z.string().nullable(),
  sharedNotes: z.string().nullable(),
  cancelledReason: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const talkingPointResponseSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  addedByEmployeeId: z.string(),
  content: z.string(),
  isResolved: z.boolean(),
  position: z.number(),
  createdAt: z.date(),
});

export const actionItemResponseSchema = z.object({
  id: z.string(),
  meetingId: z.string(),
  ownerId: z.string(),
  content: z.string(),
  isCompleted: z.boolean(),
  dueDate: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const oneOnOneMeetingDetailResponseSchema = z.object({
  meeting: oneOnOneMeetingResponseSchema,
  talkingPoints: z.array(talkingPointResponseSchema),
  actionItems: z.array(actionItemResponseSchema),
});

export const listOneOnOneMeetingsResponseSchema = z.object({
  meetings: z.array(oneOnOneMeetingResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export const createTalkingPointBodySchema = z.object({
  content: z.string().min(1).max(2048),
});

export const updateTalkingPointBodySchema = z
  .object({
    content: z.string().min(1).max(2048).optional(),
    isResolved: z.boolean().optional(),
  })
  .refine(
    (value) => Object.values(value).some((current) => current !== undefined),
    { message: 'Pelo menos um campo deve ser informado' },
  );

export const createActionItemBodySchema = z.object({
  content: z.string().min(1).max(2048),
  ownerId: z.string().uuid(),
  dueDate: z.coerce.date().optional(),
});

export const updateActionItemBodySchema = z
  .object({
    content: z.string().min(1).max(2048).optional(),
    ownerId: z.string().uuid().optional(),
    dueDate: z.coerce.date().nullish(),
    isCompleted: z.boolean().optional(),
  })
  .refine(
    (value) => Object.values(value).some((current) => current !== undefined),
    { message: 'Pelo menos um campo deve ser informado' },
  );
