import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRemoveItemFromVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-remove-item-from-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeItemFromVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/volumes/:id/items/:itemId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.REMOVE_ITEM,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Remove item from volume',
      params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      response: {
        204: z.void(),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id, itemId } = request.params;
      const tenantId = request.user.tenantId!;

      const removeItemFromVolumeUseCase = makeRemoveItemFromVolumeUseCase();

      await removeItemFromVolumeUseCase.execute({
        tenantId,
        volumeId: id,
        itemId,
      });

      return reply.status(204).send();
    },
  });
}
