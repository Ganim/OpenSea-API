import { z } from 'zod';

export const updateSessionModeParamsSchema = z.object({
  terminalId: z.string().uuid(),
});

export const updateSessionModeBodySchema = z.object({
  operatorSessionMode: z.enum(['PER_SALE', 'STAY_LOGGED_IN']),
  operatorSessionTimeout: z.number().int().positive().nullable().optional(),
  autoCloseSessionAt: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      'autoCloseSessionAt must be in HH:MM 24h format',
    )
    .nullable()
    .optional(),
  coordinationMode: z
    .enum(['STANDALONE', 'SELLER', 'CASHIER', 'BOTH'])
    .optional(),
});

export const updateSessionModeResponseSchema = z.object({
  terminal: z.object({
    id: z.string(),
    tenantId: z.string(),
    terminalName: z.string(),
    terminalCode: z.string(),
    operatorSessionMode: z.enum(['PER_SALE', 'STAY_LOGGED_IN']),
    operatorSessionTimeout: z.number().int().nullable(),
    autoCloseSessionAt: z.string().nullable(),
    coordinationMode: z.enum(['STANDALONE', 'SELLER', 'CASHIER', 'BOTH']),
    appliedProfileId: z.string().nullable(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  }),
});
