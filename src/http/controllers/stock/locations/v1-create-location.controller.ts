import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { createLocationSchema, locationResponseSchema } from '@/http/schemas';
import { locationToDTO } from '@/mappers/stock/location/location-to-dto';
import { makeCreateLocationUseCase } from '@/use-cases/stock/locations/factories/make-create-location-use-case';

export async function createLocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/locations',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Locations'],
      summary: 'Create a new location',
      security: [{ bearerAuth: [] }],
      body: createLocationSchema,
      response: {
        201: z.object({ location: locationResponseSchema }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      try {
        const useCase = makeCreateLocationUseCase();

        const result = await useCase.execute(request.body);

        return reply.status(201).send({ location: locationToDTO(result.location) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
