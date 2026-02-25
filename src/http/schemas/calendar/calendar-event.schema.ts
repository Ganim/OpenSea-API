import { z } from 'zod';

export const eventTypeEnum = z.enum([
  'MEETING',
  'TASK',
  'REMINDER',
  'DEADLINE',
  'HOLIDAY',
  'BIRTHDAY',
  'VACATION',
  'ABSENCE',
  'FINANCE_DUE',
  'PURCHASE_ORDER',
  'CUSTOM',
]);

export const eventVisibilityEnum = z.enum(['PUBLIC', 'PRIVATE']);

export const participantRoleEnum = z.enum(['OWNER', 'ASSIGNEE', 'GUEST']);

export const participantStatusEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'TENTATIVE',
]);

export const createCalendarEventSchema = z
  .object({
    title: z.string().min(1).max(256),
    description: z.string().max(5000).optional().nullable(),
    location: z.string().max(512).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isAllDay: z.boolean().optional().default(false),
    type: eventTypeEnum.optional().default('CUSTOM'),
    visibility: eventVisibilityEnum.optional().default('PUBLIC'),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
      .optional()
      .nullable(),
    rrule: z.string().max(512).optional().nullable(),
    timezone: z.string().max(64).optional().nullable(),
    participants: z
      .array(
        z.object({
          userId: z.string().uuid(),
          role: participantRoleEnum.optional().default('GUEST'),
        }),
      )
      .optional(),
    reminders: z
      .array(
        z.object({
          minutesBefore: z.number().int().min(0).max(40320),
        }),
      )
      .optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateCalendarEventSchema = z
  .object({
    title: z.string().min(1).max(256).optional(),
    description: z.string().max(5000).optional().nullable(),
    location: z.string().max(512).optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    isAllDay: z.boolean().optional(),
    type: eventTypeEnum.optional(),
    visibility: eventVisibilityEnum.optional(),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color')
      .optional()
      .nullable(),
    rrule: z.string().max(512).optional().nullable(),
    timezone: z.string().max(64).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export const listCalendarEventsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  type: eventTypeEnum.optional(),
  search: z.string().max(256).optional(),
  includeSystemEvents: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(500),
});

export const participantResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.string(),
  status: z.string(),
  respondedAt: z.coerce.date().optional().nullable(),
  userName: z.string().optional().nullable(),
  userEmail: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const reminderResponseSchema = z.object({
  id: z.string().uuid(),
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  minutesBefore: z.number(),
  isSent: z.boolean(),
  sentAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
});

export const calendarEventResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isAllDay: z.boolean(),
  type: z.string(),
  visibility: z.string(),
  color: z.string().optional().nullable(),
  rrule: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  systemSourceType: z.string().optional().nullable(),
  systemSourceId: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().uuid(),
  creatorName: z.string().optional().nullable(),
  participants: z.array(participantResponseSchema).optional(),
  reminders: z.array(reminderResponseSchema).optional(),
  isRecurring: z.boolean().optional(),
  occurrenceDate: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const respondToEventSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED', 'TENTATIVE']),
});

export const inviteParticipantsSchema = z.object({
  participants: z
    .array(
      z.object({
        userId: z.string().uuid(),
        role: participantRoleEnum.optional().default('GUEST'),
      }),
    )
    .min(1),
});

export const manageRemindersSchema = z.object({
  reminders: z.array(
    z.object({
      minutesBefore: z.number().int().min(0).max(40320),
    }),
  ),
});
