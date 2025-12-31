import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema, manufacturerResponseSchema } from '@/http/schemas/hr.schema';
import { manufacturerToDTO } from '@/mappers/hr/organization/manufacturer-to-dto';
import { makeGetManufacturerByIdUseCase } from '@/use-cases/hr/manufacturers/factories/make-manufacturers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetManufacturerByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/manufacturers/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Manufacturers'],
      summary: 'Get manufacturer by ID',
      description: 'Retrieves a manufacturer by its ID',
      params: z.object({
        id: idSchema,
      }),
      response: {
        200: manufacturerResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getManufacturerByIdUseCase = makeGetManufacturerByIdUseCase();
        const { manufacturer } = await getManufacturerByIdUseCase.execute({
          id,
        });

        return reply.status(200).send(manufacturerToDTO(manufacturer));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
