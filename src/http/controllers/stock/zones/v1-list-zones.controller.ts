import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listZonesQuerySchema,
  zoneListResponseSchema,
} from '@/http/schemas/stock/zones/zone.schema';
import { zoneToDTO, type ZoneStatsDTO } from '@/mappers/stock/zone/zone-to-dto';
import { makeListZonesUseCase } from '@/use-cases/stock/zones/factories/make-list-zones-use-case';
import { prisma } from '@/lib/prisma';
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
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.ACCESS,
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

      // Calculate stats per zone
      const zoneIds = zones.map((z) => z.zoneId.toString());

      const statsRows = await prisma.$queryRaw<
        Array<{
          zoneId: string;
          totalBins: bigint;
          occupiedBins: bigint;
          emptyBins: bigint;
          blockedBins: bigint;
          totalItems: bigint;
          totalCapacity: bigint;
        }>
      >`
        SELECT
          b."zone_id" AS "zoneId",
          COUNT(b.id) AS "totalBins",
          COUNT(CASE WHEN b."is_blocked" = false AND (
            SELECT COUNT(*) FROM "items" i
            WHERE i."bin_id" = b.id AND i."current_quantity" > 0 AND i."status" = 'AVAILABLE'
          ) > 0 THEN 1 END) AS "occupiedBins",
          COUNT(CASE WHEN b."is_blocked" = false AND NOT EXISTS (
            SELECT 1 FROM "items" i
            WHERE i."bin_id" = b.id AND i."current_quantity" > 0 AND i."status" = 'AVAILABLE'
          ) THEN 1 END) AS "emptyBins",
          COUNT(CASE WHEN b."is_blocked" = true THEN 1 END) AS "blockedBins",
          COALESCE(SUM((
            SELECT COUNT(*) FROM "items" i
            WHERE i."bin_id" = b.id AND i."current_quantity" > 0 AND i."status" = 'AVAILABLE'
          )), 0) AS "totalItems",
          COALESCE(SUM(b."capacity"), 0) AS "totalCapacity"
        FROM "bins" b
        WHERE b."tenant_id" = ${tenantId}
          AND b."deleted_at" IS NULL
          AND b."is_active" = true
          AND b."zone_id"::text = ANY(${zoneIds})
        GROUP BY b."zone_id"
      `;

      const statsMap = new Map<string, ZoneStatsDTO>();
      for (const row of statsRows) {
        const totalItems = Number(row.totalItems);
        const totalCapacity = Number(row.totalCapacity);
        statsMap.set(row.zoneId, {
          totalBins: Number(row.totalBins),
          occupiedBins: Number(row.occupiedBins),
          emptyBins: Number(row.emptyBins),
          blockedBins: Number(row.blockedBins),
          totalCapacity,
          occupancyPercentage:
            totalCapacity > 0
              ? Math.round((totalItems / totalCapacity) * 100)
              : 0,
        });
      }

      return reply.status(200).send({
        zones: zones.map((z) => {
          const id = z.zoneId.toString();
          return zoneToDTO(z, {
            stats: statsMap.get(id) ?? {
              totalBins: 0,
              occupiedBins: 0,
              emptyBins: 0,
              blockedBins: 0,
              totalCapacity: 0,
              occupancyPercentage: 0,
            },
          });
        }),
      });
    },
  });
}
