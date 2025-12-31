import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeMarkAllAsReadUseCase } from '@/use-cases/notifications/factories/make-mark-all-as-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function markAllAsReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/notifications/mark-all-read',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales - Notifications'],
      summary: 'Mark all user notifications as read',
      response: { 200: z.object({ count: z.number() }) },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeMarkAllAsReadUseCase();
      const { count } = await useCase.execute({ userId: request.user.sub });
      return reply.status(200).send({ count });
    },
  });
}
