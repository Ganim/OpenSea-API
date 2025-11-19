import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function processScheduledNotificationsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/process-scheduled',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications'],
      summary: 'Process pending scheduled notifications manually',
      response: {
        200: z.object({
          processed: z.number(),
          sent: z.number(),
          errors: z.array(z.object({ id: z.string(), error: z.string() })),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeProcessScheduledNotificationsUseCase();
      const result = await useCase.execute();
      return reply.status(200).send({
        processed: result.processed,
        sent: result.sent.length,
        errors: result.errors,
      });
    },
  });
}
