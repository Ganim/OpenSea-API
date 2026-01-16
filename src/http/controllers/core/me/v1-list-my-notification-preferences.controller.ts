import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { notificationPreferenceResponseSchema } from '@/http/schemas/sales.schema';
import { makeListNotificationPreferencesByUserUseCase } from '@/use-cases/sales/notification-preferences/factories/make-list-notification-preferences-by-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMyNotificationPreferencesController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/notification-preferences',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my notification preferences',
      querystring: z.object({
        enabledOnly: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          preferences: z.array(notificationPreferenceResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { enabledOnly } = request.query;

      const useCase = makeListNotificationPreferencesByUserUseCase();
      const { preferences } = await useCase.execute({ userId, enabledOnly });

      return reply.status(200).send({ preferences });
    },
  });
}
