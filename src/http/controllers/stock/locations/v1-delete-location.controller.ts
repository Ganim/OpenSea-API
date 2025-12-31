import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteLocationUseCase } from '@/use-cases/stock/locations/factories/make-delete-location-use-case';

export async function deleteLocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/locations/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.LOCATIONS.DELETE,
        resource: 'locations',
      }),
    ],
    schema: {
      tags: ['Stock - Locations'],
      summary: 'Delete location',
      description: 'Soft delete a location',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const deleteLocationUseCase = makeDeleteLocationUseCase();

        await deleteLocationUseCase.execute({ id });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
