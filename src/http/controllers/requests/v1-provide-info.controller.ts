import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeProvideInfoUseCase } from '@/use-cases/requests/factories/make-provide-info-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function provideInfoController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/requests/:id/provide-info',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Requests'],
      summary: 'Provide requested information',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        informationProvided: z.string().min(10),
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
      const useCase = makeProvideInfoUseCase();

      await useCase.execute({
        requestId: request.params.id,
        providedById: request.user.sub,
        informationProvided: request.body.informationProvided,
      });

      return reply.status(200).send({ success: true });
    },
  });
}
