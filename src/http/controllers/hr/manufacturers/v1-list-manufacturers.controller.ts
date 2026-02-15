import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  listManufacturersQuerySchema,
  manufacturerResponseSchema,
} from '@/http/schemas/hr.schema';
import { manufacturerToDTO } from '@/mappers/hr/organization/manufacturer-to-dto';
import { makeListManufacturersUseCase } from '@/use-cases/hr/manufacturers/factories/make-manufacturers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListManufacturersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/manufacturers',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Manufacturers'],
      summary: 'List manufacturers',
      description:
        'Lists manufacturers with filtering, pagination and search capabilities',
      querystring: listManufacturersQuerySchema,
      response: {
        200: z.array(manufacturerResponseSchema),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;

      try {
        const listManufacturersUseCase = makeListManufacturersUseCase();
        const { manufacturers } = await listManufacturersUseCase.execute(query);

        return reply.status(200).send(manufacturers.map(manufacturerToDTO));
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
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
