import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { locationHistoryResponseSchema } from '@/http/schemas';
import { makeGetItemLocationHistoryUseCase } from '@/use-cases/stock/items/factories/make-get-item-location-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getItemLocationHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/:id/location-history',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.READ,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'Get item location history',
      description:
        'Retorna o historico de movimentacoes de localizacao de um item (transferencias, reconfiguracoes de zona, ajustes de inventario).',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: locationHistoryResponseSchema,
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
        const getLocationHistoryUseCase = makeGetItemLocationHistoryUseCase();
        const result = await getLocationHistoryUseCase.execute({
          tenantId,
          itemId: id,
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
