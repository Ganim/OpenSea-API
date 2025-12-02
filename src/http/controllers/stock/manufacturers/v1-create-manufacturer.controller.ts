import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createManufacturerSchema,
  manufacturerResponseSchema,
} from '@/http/schemas';
import { manufacturerToDTO } from '@/mappers/stock/manufacturer/manufacturer-to-dto';
import { PrismaManufacturersRepository } from '@/repositories/stock/prisma/prisma-manufacturers-repository';
import { CreateManufacturerUseCase } from '@/use-cases/stock/manufacturers/create-manufacturer';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/manufacturers',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Manufacturers'],
      summary: 'Create a new manufacturer',
      description: 'Create a new manufacturer with the provided information',
      body: createManufacturerSchema,
      response: {
        201: z.object({
          manufacturer: manufacturerResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const manufacturersRepository = new PrismaManufacturersRepository();
      const createManufacturerUseCase = new CreateManufacturerUseCase(
        manufacturersRepository,
      );

      const result = await createManufacturerUseCase.execute(request.body);

      return reply.status(201).send({
        manufacturer: manufacturerToDTO(result.manufacturer),
      });
    },
  });
}
