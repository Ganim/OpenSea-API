import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-delete-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/volumes/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.DELETE,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Delete volume (soft delete)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.void(),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      const deleteVolumeUseCase = makeDeleteVolumeUseCase();

      await deleteVolumeUseCase.execute({ tenantId, volumeId: id });

      return reply.status(204).send();
    },
  });
}
