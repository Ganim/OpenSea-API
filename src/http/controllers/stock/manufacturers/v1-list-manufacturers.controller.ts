import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { manufacturerResponseSchema } from '@/http/schemas';
import { makeListManufacturersUseCase } from '@/use-cases/stock/manufacturers/factories/make-list-manufacturers-use-case';

export async function listManufacturersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/manufacturers',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Manufacturers'],
      summary: 'List all manufacturers',
      response: {
        200: z.object({
          manufacturers: z.array(manufacturerResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const useCase = makeListManufacturersUseCase();

      const result = await useCase.execute();

      return reply.send(result);
    },
  });
}
