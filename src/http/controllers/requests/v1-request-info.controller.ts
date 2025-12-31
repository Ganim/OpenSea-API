import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeRequestInfoUseCase } from '@/use-cases/requests/factories/make-request-info-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function requestInfoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/request-info',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Core - Requests'],
      summary: 'Request additional information from requester',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        infoRequested: z.string().min(10),
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
      const useCase = makeRequestInfoUseCase();

      await useCase.execute({
        requestId: request.params.id,
        requestedById: request.user.sub,
        infoRequested: request.body.infoRequested,
      });

      return reply.status(200).send({ success: true });
    },
  });
}
