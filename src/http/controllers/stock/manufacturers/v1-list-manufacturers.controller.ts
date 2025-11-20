import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { manufacturerResponseSchema } from '@/http/schemas';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { makeListManufacturersUseCase } from '@/use-cases/stock/manufacturers/factories/make-list-manufacturers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

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

      return reply.send({
        manufacturers: result.manufacturers.map(manufacturerToDTO),
      });
    },
  });
}
