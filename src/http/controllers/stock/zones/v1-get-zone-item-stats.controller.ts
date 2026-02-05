import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { zoneItemStatsResponseSchema } from '@/http/schemas/stock/zones/zone.schema';
import { makeGetZoneItemStatsUseCase } from '@/use-cases/stock/zones/factories/make-get-zone-item-stats-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getZoneItemStatsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/zones/:id/item-stats',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.READ,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Get zone item statistics',
      description:
        'Retorna estatisticas sobre bins e itens de uma zona, incluindo bins ativos, bloqueados, ocupados, e contagem de itens.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: zoneItemStatsResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const getZoneItemStatsUseCase = makeGetZoneItemStatsUseCase();
        const result = await getZoneItemStatsUseCase.execute({
          tenantId,
          zoneId: id,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
