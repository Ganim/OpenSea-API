import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { VolumeHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import {
  listVolumesQuerySchema,
  volumeResponseSchema,
} from '@/http/schemas/stock/volumes/volume.schema';
import { makeListVolumesUseCase } from '@/use-cases/stock/volumes/factories/make-list-volumes-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVolumesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/volumes',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.LIST,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'List all volumes with pagination',
      querystring: listVolumesQuerySchema,
      response: {
        200: z.object({
          volumes: z.array(volumeResponseSchema),
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { page = 1, limit = 20, status } = request.query;
      const tenantId = request.user.tenantId!;

      const listVolumesUseCase = makeListVolumesUseCase();

      const result = await listVolumesUseCase.execute({
        tenantId,
        page,
        limit,
        status,
      });

      return reply.status(200).send({
        volumes: result.volumes.map(VolumeHttpPresenter.toHTTP),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    },
  });
}
