import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { manufacturerResponseSchema } from '@/http/schemas';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { GetManufacturerByIdUseCase } from '@/use-cases/stock/manufacturers/get-manufacturer-by-id';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getManufacturerByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/manufacturers/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Manufacturers'],
      summary: 'Get manufacturer by ID',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({
          manufacturer: manufacturerResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      const manufacturersRepository = new PrismaManufacturersRepository();
      const getManufacturerByIdUseCase = new GetManufacturerByIdUseCase(
        manufacturersRepository,
      );

      try {
        const result = await getManufacturerByIdUseCase.execute({ id });

        return reply.status(200).send({
          manufacturer: manufacturerToDTO(result.manufacturer),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
