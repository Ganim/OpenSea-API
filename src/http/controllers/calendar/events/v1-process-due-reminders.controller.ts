import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function processDueRemindersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/calendar/reminders/process',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CALENDAR.EVENTS.MANAGE,
        resource: 'calendar-events',
      }),
    ],
    schema: {
      tags: ['Calendar - Reminders'],
      summary: 'Process due reminders (manual trigger)',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          processed: z.number(),
          errors: z.number(),
        }),
      },
    },
    handler: async (_request, reply) => {
      const useCase = makeProcessDueRemindersUseCase();
      const result = await useCase.execute();
      return reply.status(200).send(result);
    },
  });
}
