import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { warehouseResponseSchema } from '@/http/schemas/stock/warehouses/warehouse.schema';
import { warehouseToDTO } from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeGetWarehouseByIdUseCase } from '@/use-cases/stock/warehouses/factories/make-get-warehouse-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getWarehouseByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/warehouses/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.WAREHOUSES.READ,
        resource: 'warehouses',
      }),
    ],
    schema: {
      tags: ['Stock - Warehouses'],
      summary: 'Get a warehouse by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          warehouse: warehouseResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getWarehouseByIdUseCase = makeGetWarehouseByIdUseCase();
        const { warehouse, zoneCount } = await getWarehouseByIdUseCase.execute({
          id,
        });

        return reply.status(200).send({
          warehouse: warehouseToDTO(warehouse, { zoneCount }),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
