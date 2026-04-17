import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { RECURRING_FREQUENCIES } from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makePreviewRecurringDatesUseCase } from '@/use-cases/finance/recurring/factories/make-preview-recurring-dates';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// P0-31 + P1-42: the frequency enum is now imported from the shared
// RECURRING_FREQUENCIES tuple so the create, update, and preview schemas
// cannot drift again (BIWEEKLY / SEMIANNUAL went missing here previously,
// causing "save works but preview 400s" bugs). Also keep the legacy
// `interval` and `adjustBusinessDays` payload the frontend sends today;
// `adjustBusinessDays=true` maps to "skip both weekends and holidays" so
// the date list keeps obeying business-day shifts.
const previewRecurringDatesBodySchema = z
  .object({
    startDate: z.coerce.date(),
    frequency: z.enum(RECURRING_FREQUENCIES),
    interval: z.number().int().min(1).max(12).optional(),
    count: z.number().int().min(1).max(60).optional().default(12),
    skipWeekends: z.boolean().optional(),
    skipHolidays: z.boolean().optional(),
    adjustBusinessDays: z.boolean().optional(),
  })
  .transform((input) => ({
    startDate: input.startDate,
    frequency: input.frequency,
    count: input.count,
    skipWeekends: input.skipWeekends ?? input.adjustBusinessDays ?? false,
    skipHolidays: input.skipHolidays ?? input.adjustBusinessDays ?? false,
  }));

const previewDateEntrySchema = z.object({
  date: z.string(),
  isWeekend: z.boolean(),
  isHoliday: z.boolean(),
  adjustedDate: z.string().optional(),
  holidayName: z.string().optional(),
});

const previewRecurringDatesResponseSchema = z.object({
  dates: z.array(previewDateEntrySchema),
});

export async function previewRecurringDatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/recurring/preview-dates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.ACCESS,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Preview recurring entry dates',
      description:
        'Generates a preview of future dates for a recurring entry configuration, showing weekends, holidays, and adjusted dates.',
      security: [{ bearerAuth: [] }],
      body: previewRecurringDatesBodySchema,
      response: {
        200: previewRecurringDatesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const useCase = makePreviewRecurringDatesUseCase();
      const previewResult = await useCase.execute(request.body);

      return reply.status(200).send(previewResult);
    },
  });
}
