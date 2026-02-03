import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWarehouseSchema,
  warehouseResponseSchema,
} from '@/http/schemas/stock/warehouses/warehouse.schema';
import { warehouseToDTO } from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeUpdateWarehouseUseCase } from '@/use-cases/stock/warehouses/factories/make-update-warehouse-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateWarehouseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/warehouses/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.UPDATE,
        resource: 'warehouses',
      }),
    ],
    schema: {
      tags: ['Stock - Warehouses'],
      summary: 'Update a warehouse',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateWarehouseSchema,
      response: {
        200: z.object({
          warehouse: warehouseResponseSchema,
        }),
        400: z.object({
          message: z.string(),
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
      const { code, name, description, address, isActive } = request.body;

      try {
        const updateWarehouseUseCase = makeUpdateWarehouseUseCase();
        const { warehouse } = await updateWarehouseUseCase.execute({
          tenantId,
          id,
          code,
          name,
          description,
          address,
          isActive,
        });

        return reply.status(200).send({ warehouse: warehouseToDTO(warehouse) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
