import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { locationResponseSchema } from '@/http/schemas';
import { makeGetLocationByIdUseCase } from '@/use-cases/stock/locations/factories/make-get-location-by-id-use-case';

export async function getLocationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/locations/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Locations'],
      summary: 'Get location by ID',
      description: 'Get location details by ID',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({ location: locationResponseSchema }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getLocationByIdUseCase = makeGetLocationByIdUseCase();

        const { location } = await getLocationByIdUseCase.execute({ id });

        return reply.status(200).send({ location });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
