import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeMarkAsReadUseCase } from '@/use-cases/notifications/factories/make-mark-as-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function markAsReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/notifications/:id/read',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Notifications'],
      summary: 'Mark a notification as read',
      params: z.object({ id: z.string().uuid() }),
      response: { 204: z.void() },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      const useCase = makeMarkAsReadUseCase();
      await useCase.execute({ notificationId: id });

      return reply.status(204).send();
    },
  });
}
