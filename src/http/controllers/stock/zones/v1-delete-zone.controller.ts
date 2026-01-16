import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteZoneUseCase } from '@/use-cases/stock/zones/factories/make-delete-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/zones/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.DELETE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Delete a zone',
      params: z.object({
        id: z.string().uuid(),
      }),
      querystring: z.object({
        forceDeleteBins: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          deletedBinsCount: z.number(),
        }),
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
      const { forceDeleteBins } = request.query;

      try {
        const deleteZoneUseCase = makeDeleteZoneUseCase();
        const { success, deletedBinsCount } = await deleteZoneUseCase.execute({
          id,
          forceDeleteBins,
        });

        return reply.status(200).send({ success, deletedBinsCount });
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
