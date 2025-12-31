import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  idSchema,
  manufacturerResponseSchema,
  updateManufacturerSchema,
} from '@/http/schemas/hr.schema';
import { manufacturerToDTO } from '@/mappers/hr/organization/manufacturer-to-dto';
import { makeUpdateManufacturerUseCase } from '@/use-cases/hr/manufacturers/factories/make-manufacturers';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/manufacturers/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MANUFACTURERS.UPDATE,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['HR - Manufacturers'],
      summary: 'Update manufacturer',
      description: 'Updates a manufacturer by its ID',
      params: z.object({
        id: idSchema,
      }),
      body: updateManufacturerSchema,
      response: {
        200: manufacturerResponseSchema,
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
      const { id } = request.params;
      const data = request.body;

      try {
        const updateManufacturerUseCase = makeUpdateManufacturerUseCase();
        const { manufacturer } = await updateManufacturerUseCase.execute({
          id,
          ...data,
        });

        return reply.status(200).send(manufacturerToDTO(manufacturer));
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
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
