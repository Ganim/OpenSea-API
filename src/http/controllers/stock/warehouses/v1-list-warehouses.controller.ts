import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWarehousesQuerySchema,
  warehouseListResponseSchema,
} from '@/http/schemas/stock/warehouses/warehouse.schema';
import {
  warehouseToDTO,
  type WarehouseStatsDTO,
} from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeListWarehousesUseCase } from '@/use-cases/stock/warehouses/factories/make-list-warehouses-use-case';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listWarehousesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/warehouses',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.ACCESS,
        resource: 'warehouses',
      }),
    ],
    schema: {
      tags: ['Stock - Warehouses'],
      summary: 'List all warehouses',
      querystring: listWarehousesQuerySchema,
      response: {
        200: warehouseListResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { activeOnly } = request.query;

      const listWarehousesUseCase = makeListWarehousesUseCase();
      const { warehouses } = await listWarehousesUseCase.execute({
        tenantId,
        activeOnly,
      });

      // Calculate stats per warehouse
      const warehouseIds = warehouses.map((w) => w.warehouseId.toString());

      const statsRows = await prisma.$queryRaw<
        Array<{
          warehouseId: string;
          totalZones: bigint;
          totalBins: bigint;
          occupiedBins: bigint;
          totalItems: bigint;
          totalCapacity: bigint;
        }>
      >`
        SELECT
          z."warehouse_id" AS "warehouseId",
          COUNT(DISTINCT z.id) AS "totalZones",
          COUNT(b.id) AS "totalBins",
          COUNT(CASE WHEN (
            SELECT COUNT(*) FROM "items" i
            WHERE i."bin_id" = b.id AND i."current_quantity" > 0 AND i."status" = 'AVAILABLE'
          ) > 0 THEN 1 END) AS "occupiedBins",
          COALESCE(SUM((
            SELECT COUNT(*) FROM "items" i
            WHERE i."bin_id" = b.id AND i."current_quantity" > 0 AND i."status" = 'AVAILABLE'
          )), 0) AS "totalItems",
          COALESCE(SUM(b."capacity"), 0) AS "totalCapacity"
        FROM "zones" z
        LEFT JOIN "bins" b ON b."zone_id" = z.id AND b."deleted_at" IS NULL AND b."is_active" = true
        WHERE z."tenant_id" = ${tenantId}
          AND z."deleted_at" IS NULL
          AND z."warehouse_id"::text = ANY(${warehouseIds})
        GROUP BY z."warehouse_id"
      `;

      const statsMap = new Map<string, WarehouseStatsDTO>();
      for (const row of statsRows) {
        const totalItems = Number(row.totalItems);
        const totalCapacity = Number(row.totalCapacity);
        statsMap.set(row.warehouseId, {
          totalZones: Number(row.totalZones),
          totalBins: Number(row.totalBins),
          occupiedBins: Number(row.occupiedBins),
          totalCapacity,
          occupancyPercentage:
            totalCapacity > 0
              ? Math.round((totalItems / totalCapacity) * 100)
              : 0,
        });
      }

      return reply.status(200).send({
        warehouses: warehouses.map((w) => {
          const id = w.warehouseId.toString();
          return warehouseToDTO(w, {
            stats: statsMap.get(id) ?? {
              totalZones: 0,
              totalBins: 0,
              occupiedBins: 0,
              totalCapacity: 0,
              occupancyPercentage: 0,
            },
          });
        }),
      });
    },
  });
}
