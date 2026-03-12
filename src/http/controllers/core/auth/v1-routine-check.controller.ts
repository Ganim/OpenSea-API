import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRoutineCheckUseCase } from '@/use-cases/core/auth/factories/make-routine-check-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function routineCheckController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/routine-check',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Auth'],
      summary:
        'Run idempotent routine checks (overdue finance, calendar reminders)',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          finance: z
            .object({
              markedOverdue: z.number(),
              dueSoonAlerts: z.number(),
            })
            .nullable(),
          calendarReminders: z
            .object({
              processed: z.number(),
              errors: z.number(),
            })
            .nullable(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeRoutineCheckUseCase();
      const result = await useCase.execute({ tenantId, userId });

      return reply.status(200).send(result);
    },
  });
}
