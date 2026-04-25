import { z } from 'zod';

import { posTerminalOperatorResponseSchema } from './assign-operator.schema';

export const revokeOperatorParamsSchema = z.object({
  terminalId: z.string().uuid(),
  employeeId: z.string().uuid(),
});

export const revokeOperatorResponseSchema = z.object({
  operator: posTerminalOperatorResponseSchema,
});
