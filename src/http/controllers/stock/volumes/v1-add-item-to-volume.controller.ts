import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { VolumeItemHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import {
  addItemToVolumeSchema,
  volumeItemResponseSchema,
} from '@/http/schemas/stock/volumes/volume.schema';
import { makeAddItemToVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-add-item-to-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function addItemToVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/volumes/:id/items',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.ADD_ITEM,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Add item to volume',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: addItemToVolumeSchema,
      response: {
        201: z.object({
          volumeItem: volumeItemResponseSchema,
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
      const { itemId } = request.body;
      const userId = request.user.sub;

      const addItemToVolumeUseCase = makeAddItemToVolumeUseCase();

      const result = await addItemToVolumeUseCase.execute({
        volumeId: id,
        itemId,
        addedBy: userId,
      });

      return reply.status(201).send({
        volumeItem: VolumeItemHttpPresenter.toHTTP(result.volumeItem),
      });
    },
  });
}
