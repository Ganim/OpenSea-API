import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createManufacturerSchema,
  manufacturerResponseSchema,
} from '@/http/schemas/hr.schema';
import { manufacturerToDTO } from '@/mappers/hr/organization/manufacturer-to-dto';
import { makeCreateManufacturerUseCase } from '@/use-cases/hr/manufacturers/factories/make-manufacturers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/manufacturers',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MANUFACTURERS.CREATE,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['HR - Manufacturers'],
      summary: 'Create a new manufacturer',
      description: 'Creates a new manufacturer in the system',
      body: createManufacturerSchema,
      response: {
        201: manufacturerResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const createManufacturerUseCase = makeCreateManufacturerUseCase();
        const { manufacturer } = await createManufacturerUseCase.execute(data);

        return reply.status(201).send(manufacturerToDTO(manufacturer));
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
