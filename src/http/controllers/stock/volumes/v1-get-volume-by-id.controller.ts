import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import { volumeResponseSchema } from '@/http/schemas/stock/volumes/volume.schema';
import { makeGetVolumeByIdUseCase } from '@/use-cases/stock/volumes/factories/make-get-volume-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVolumeByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/volumes/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.READ,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Get volume by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          volume: volumeResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      const getVolumeByIdUseCase = makeGetVolumeByIdUseCase();

      const result = await getVolumeByIdUseCase.execute({
        tenantId,
        volumeId: id,
      });

      return reply.status(200).send({
        volume: VolumeHttpPresenter.toHTTP(result.volume),
      });
    },
  });
}
