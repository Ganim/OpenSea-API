import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeDeleteNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-delete-notification-preference-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteNotificationPreferenceController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/notification-preferences/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Notification Preferences'],
      summary: 'Delete a notification preference (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeDeleteNotificationPreferenceUseCase();
        await useCase.execute({ id });

        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
