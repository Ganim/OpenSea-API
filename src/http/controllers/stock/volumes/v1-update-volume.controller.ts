import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import {
  updateVolumeSchema,
  volumeResponseSchema,
} from '@/http/schemas/stock/volumes/volume.schema';
import { makeUpdateVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-update-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/volumes/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.UPDATE,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Update volume',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateVolumeSchema,
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
      const { name, notes, destinationRef, status } = request.body;
      const tenantId = request.user.tenantId!;

      const updateVolumeUseCase = makeUpdateVolumeUseCase();

      const result = await updateVolumeUseCase.execute({
        tenantId,
        volumeId: id,
        name,
        notes,
        destinationRef,
        status,
      });

      return reply.status(200).send({
        volume: VolumeHttpPresenter.toHTTP(result.volume),
      });
    },
  });
}
