import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeAssignRequestUseCase } from '@/use-cases/requests/factories/make-assign-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function assignRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/assign',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Requests'],
      summary: 'Assign request to a user',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        assignedToId: z.string().uuid(),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeAssignRequestUseCase();

      await useCase.execute({
        requestId: request.params.id,
        assignedToId: request.body.assignedToId,
        performedById: request.user.sub,
        userRole: request.user.role,
      });

      return reply.status(200).send({ success: true });
    },
  });
}
