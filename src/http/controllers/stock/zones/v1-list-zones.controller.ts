import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listZonesQuerySchema,
  zoneListResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeListZonesUseCase } from '@/use-cases/stock/zones/factories/make-list-zones-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listZonesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/zones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.LIST,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'List all zones',
      description:
        'Lista todas as zonas com filtros opcionais por armazem e status ativo.',
      querystring: listZonesQuerySchema,
      response: {
        200: zoneListResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { warehouseId, activeOnly } = request.query;

      const listZonesUseCase = makeListZonesUseCase();
      const { zones } = await listZonesUseCase.execute({
        tenantId,
        warehouseId,
        activeOnly,
      });

      return reply.status(200).send({
        zones: zones.map((z) => zoneToDTO(z)),
      });
    },
  });
}
