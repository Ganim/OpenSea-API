import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWarehousesQuerySchema,
  warehouseListResponseSchema,
} from '@/http/schemas/stock/warehouses/warehouse.schema';
import { warehouseToDTO } from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeListWarehousesUseCase } from '@/use-cases/stock/warehouses/factories/make-list-warehouses-use-case';
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
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.LIST,
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

      return reply.status(200).send({
        warehouses: warehouses.map((w) => warehouseToDTO(w)),
      });
    },
  });
}
