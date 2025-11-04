import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { notificationPreferenceResponseSchema } from '@/http/schemas/sales.schema';
import { makeListNotificationPreferencesByUserUseCase } from '@/use-cases/sales/notification-preferences/factories/make-list-notification-preferences-by-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listNotificationPreferencesByUserController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/notification-preferences/user/:userId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notification Preferences'],
      summary: 'List notification preferences by user',
      params: z.object({ userId: z.string().uuid() }),
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
      const { userId } = request.params as { userId: string };
      const { enabledOnly } = request.query as { enabledOnly?: boolean };

      const useCase = makeListNotificationPreferencesByUserUseCase();
      const { preferences } = await useCase.execute({ userId, enabledOnly });

      return reply.status(200).send({ preferences });
    },
  });
}
