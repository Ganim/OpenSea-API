import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeCompleteRequestUseCase } from '@/use-cases/requests/factories/make-complete-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function completeRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/complete',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Complete a request',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        completionNotes: z.string().optional(),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeCompleteRequestUseCase();

      await useCase.execute({
        requestId: request.params.id,
        completedById: request.user.sub,
        completionNotes: request.body.completionNotes,
      });

      return reply.status(200).send({ success: true });
    },
  });
}
