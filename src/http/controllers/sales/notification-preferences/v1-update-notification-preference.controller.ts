import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  notificationPreferenceResponseSchema,
  updateNotificationPreferenceSchema,
} from '@/http/schemas/sales.schema';
import { makeUpdateNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-update-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/notification-preferences/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Notification Preferences'],
      summary: 'Update a notification preference',
      params: z.object({ id: z.string().uuid() }),
      body: updateNotificationPreferenceSchema,
      response: {
        200: z.object({ preference: notificationPreferenceResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeUpdateNotificationPreferenceUseCase();
        const { preference } = await useCase.execute({
          id,
          ...request.body,
        });

        return reply.status(200).send({ preference });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
