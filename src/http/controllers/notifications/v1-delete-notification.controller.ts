import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteNotificationUseCase } from '@/use-cases/notifications/factories/make-delete-notification-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteNotificationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/notifications/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Delete a notification (soft delete)',
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.void() },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      const useCase = makeDeleteNotificationUseCase();
      await useCase.execute({ notificationId: id });

      return reply.status(204).send();
    },
  });
}
