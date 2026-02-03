import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateZoneLayoutSchema,
  zoneResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeUpdateZoneLayoutUseCase } from '@/use-cases/stock/zones/factories/make-update-zone-layout-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateZoneLayoutController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/zones/:id/layout',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.UPDATE,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Update zone custom layout',
      description:
        'Atualiza o layout personalizado de visualizacao de uma zona. Permite configurar posicionamento e aparencia dos bins na interface 2D.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateZoneLayoutSchema,
      response: {
        200: z.object({
          zone: zoneResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { layout } = request.body;

      try {
        const updateZoneLayoutUseCase = makeUpdateZoneLayoutUseCase();
        const { zone } = await updateZoneLayoutUseCase.execute({
          tenantId,
          zoneId: id,
          layout,
        });

        return reply.status(200).send({ zone: zoneToDTO(zone) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
