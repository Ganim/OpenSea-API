import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { locationResponseSchema } from '@/http/schemas';
import { makeListLocationsUseCase } from '@/use-cases/stock/locations/factories/make-list-locations-use-case';

export async function listLocationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/locations',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Locations'],
      summary: 'List all active locations',
      description: 'List all active storage locations',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          locations: z.array(locationResponseSchema),
        }),
      },
    },

    handler: async (_request, reply) => {
      const listLocationsUseCase = makeListLocationsUseCase();

      const { locations } = await listLocationsUseCase.execute();

      return reply.status(200).send({ locations });
    },
  });
}
