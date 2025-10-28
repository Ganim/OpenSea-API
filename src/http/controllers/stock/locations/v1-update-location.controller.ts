import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { locationResponseSchema, updateLocationSchema } from '@/http/schemas';
import { makeUpdateLocationUseCase } from '@/use-cases/stock/locations/factories/make-update-location-use-case';

export async function updateLocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/locations/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Locations'],
      summary: 'Update location',
      description: 'Update location details',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      body: updateLocationSchema,
      response: {
        200: z.object({ location: locationResponseSchema }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const updateLocationUseCase = makeUpdateLocationUseCase();

        const { location } = await updateLocationUseCase.execute({
          id,
          ...request.body,
        });

        return reply.status(200).send({ location });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
