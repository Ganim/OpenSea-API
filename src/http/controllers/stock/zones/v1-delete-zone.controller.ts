import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
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
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.DELETE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Delete a zone',
      description:
        'Remove uma zona e opcionalmente seus bins associados. Bins com itens alocados impedem a exclusao, a menos que forceDeleteBins esteja habilitado.',
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
          itemsDetached: z.number(),
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
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;
      const { forceDeleteBins } = request.query;

      try {
        const deleteZoneUseCase = makeDeleteZoneUseCase();
        const { success, deletedBinsCount, itemsDetached } =
          await deleteZoneUseCase.execute({
            tenantId,
            id,
            userId,
            forceDeleteBins,
          });

        return reply
          .status(200)
          .send({ success, deletedBinsCount, itemsDetached });
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
