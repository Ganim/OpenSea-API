import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { RomaneioHttpPresenter } from '@/http/presenters/stock/volume-presenter';
import { romaneioResponseSchema } from '@/http/schemas/stock/volumes/volume.schema';
import { makeGetRomaneioUseCase } from '@/use-cases/stock/volumes/factories/make-get-romaneio-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getRomaneioController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/volumes/:id/romaneio',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VOLUMES.ROMANEIO,
        resource: 'volumes',
      }),
    ],
    schema: {
      tags: ['Stock - Volumes'],
      summary: 'Get romaneio (shipment manifest) for volume',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          romaneio: romaneioResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      const getRomaneioUseCase = makeGetRomaneioUseCase();

      const result = await getRomaneioUseCase.execute({
        volumeId: id,
      });

      return reply.status(200).send({
        romaneio: RomaneioHttpPresenter.toHTTP(result.romaneio),
      });
    },
  });
}
