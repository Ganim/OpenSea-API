import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeCancelRequestUseCase } from '@/use-cases/requests/factories/make-cancel-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/cancel',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Requests'],
      summary: 'Cancel a request',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        cancellationReason: z.string().min(10),
      }),
      response: {
        200: z.object({ success: z.boolean() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const useCase = makeCancelRequestUseCase();

      await useCase.execute({
        requestId: request.params.id,
        cancelledById: request.user.sub,
        cancellationReason: request.body.cancellationReason,
        userRole: request.user.role,
      });

      return reply.status(200).send({ success: true });
    },
  });
}
