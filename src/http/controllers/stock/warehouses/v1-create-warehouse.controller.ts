import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createWarehouseSchema,
  warehouseResponseSchema,
} from '@/http/schemas/stock/warehouses/warehouse.schema';
import { warehouseToDTO } from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeCreateWarehouseUseCase } from '@/use-cases/stock/warehouses/factories/make-create-warehouse-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWarehouseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/warehouses',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.CREATE,
        resource: 'warehouses',
      }),
    ],
    schema: {
      tags: ['Stock - Warehouses'],
      summary: 'Create a new warehouse',
      body: createWarehouseSchema,
      response: {
        201: z.object({
          warehouse: warehouseResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { code, name, description, address, isActive } = request.body;

      try {
        const createWarehouseUseCase = makeCreateWarehouseUseCase();
        const { warehouse } = await createWarehouseUseCase.execute({
          code,
          name,
          description,
          address,
          isActive,
        });

        return reply.status(201).send({ warehouse: warehouseToDTO(warehouse) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
