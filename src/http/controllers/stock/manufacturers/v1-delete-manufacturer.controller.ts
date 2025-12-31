import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteManufacturerUseCase } from '@/use-cases/stock/manufacturers/factories/make-delete-manufacturer-use-case';

export async function deleteManufacturerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/manufacturers/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.MANUFACTURERS.DELETE,
        resource: 'manufacturers',
      }),
    ],
    schema: {
      tags: ['Stock - Manufacturers'],
      summary: 'Delete a manufacturer',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.void(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const useCase = makeDeleteManufacturerUseCase();

        await useCase.execute({ id });

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
