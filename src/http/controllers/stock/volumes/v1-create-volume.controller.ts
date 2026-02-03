import { PermissionCodes } from '@/constants/rbac';
import { VolumeStatus } from '@/entities/stock/value-objects/volume-status';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import {
  createVolumeBodySchema,
  volumeResponseSchema,
} from '@/http/schemas/stock/volumes/volume.schema';
import { makeCreateVolumeUseCase } from '@/use-cases/stock/volumes/factories/make-create-volume-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createVolumeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/volumes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.CREATE,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Create a new volume',
      body: createVolumeBodySchema,
      response: {
        201: z.object({
          volume: volumeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { name, notes, destinationRef, salesOrderId, customerId, status } =
        request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const createVolumeUseCase = makeCreateVolumeUseCase();

      const result = await createVolumeUseCase.execute({
        tenantId,
        name,
        notes,
        destinationRef,
        salesOrderId,
        customerId,
        status: status as VolumeStatus | undefined,
        createdBy: userId,
      });

      return reply.status(201).send({
        volume: VolumeHttpPresenter.toHTTP(result.volume),
      });
    },
  });
}
