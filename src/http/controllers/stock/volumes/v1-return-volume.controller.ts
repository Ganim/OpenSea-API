import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import { volumeResponseSchema } from '@/http/schemas/stock/volumes/volume.schema';
import { makeReturnVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-return-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function returnVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/volumes/:id/return',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.RETURN,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Mark volume as returned',
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

      const returnVolumeUseCase = makeReturnVolumeUseCase();

      const result = await returnVolumeUseCase.execute({
        volumeId: id,
      });

      return reply.status(200).send({
        volume: VolumeHttpPresenter.toHTTP(result.volume),
      });
    },
  });
}
