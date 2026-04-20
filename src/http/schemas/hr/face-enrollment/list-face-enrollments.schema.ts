import { z } from 'zod';

import { faceEnrollmentDtoSchema } from './create-face-enrollments.schema';

/**
 * Zod schemas for GET /v1/hr/employees/:id/face-enrollments. Params share
 * the same shape as create; response is `{ items, count }` metadata only.
 */

export const listFaceEnrollmentsParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listFaceEnrollmentsResponseSchema = z.object({
  items: z.array(faceEnrollmentDtoSchema),
  count: z.number().int().nonnegative(),
});
