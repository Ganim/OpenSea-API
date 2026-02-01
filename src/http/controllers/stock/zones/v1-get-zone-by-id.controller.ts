import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { zoneResponseSchema } from '@/http/schemas/stock/zones/zone.schema';
import { warehouseResponseSchema } from '@/http/schemas/stock/warehouses/warehouse.schema';
import { zoneToDTO } from '@/mappers/stock/zone/zone-to-dto';
import { warehouseToDTO } from '@/mappers/stock/warehouse/warehouse-to-dto';
import { makeGetZoneByIdUseCase } from '@/use-cases/stock/zones/factories/make-get-zone-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getZoneByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/zones/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ZONES.READ,
        resource: 'zones',
      }),
    ],
    schema: {
      tags: ['Stock - Zones'],
      summary: 'Get a zone by ID',
      description:
        'Retorna os detalhes de uma zona especifica, incluindo informacoes do armazem associado e contagem de bins.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          zone: zoneResponseSchema,
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
        const getZoneByIdUseCase = makeGetZoneByIdUseCase();
        const { zone, warehouse, binCount } = await getZoneByIdUseCase.execute({
          id,
        });

        return reply.status(200).send({
          zone: zoneToDTO(zone, { binCount }),
          warehouse: warehouseToDTO(warehouse),
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
