import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import { volumeResponseSchema } from '@/http/schemas/stock/volumes/volume.schema';
import { makeCloseVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-close-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function closeVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/volumes/:id/close',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.CLOSE,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Close volume',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          volume: volumeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const closeVolumeUseCase = makeCloseVolumeUseCase();

      const result = await closeVolumeUseCase.execute({
        tenantId,
        volumeId: id,
        closedBy: userId,
      });

      return reply.status(200).send({
        volume: VolumeHttpPresenter.toHTTP(result.volume),
      });
    },
  });
}
