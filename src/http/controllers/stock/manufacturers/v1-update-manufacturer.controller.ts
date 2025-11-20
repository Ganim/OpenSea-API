import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
    manufacturerResponseSchema,
    updateManufacturerSchema,
} from '@/http/schemas';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { makeUpdateManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-update-manufacturer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/manufacturers/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Manufacturers'],
      summary: 'Update an existing manufacturer',
      description:
        'Update an existing manufacturer with the provided information',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateManufacturerSchema,
      response: {
        200: z.object({
          manufacturer: manufacturerResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body;

      try {
        const useCase = makeUpdateManufacturerUseCase();

        const result = await useCase.execute({
          id,
          ...body,
        });

        return reply.send({
          manufacturer: manufacturerToDTO(result.manufacturer),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
