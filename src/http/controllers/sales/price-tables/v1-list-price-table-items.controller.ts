import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPriceTableItemsQuerySchema,
  priceTableItemResponseSchema,
} from '@/http/schemas';
import { makeGetPriceTableByIdUseCase } from '@/use-cases/sales/price-tables/factories/make-get-price-table-by-id-use-case';
import { makeListPriceTableItemsUseCase } from '@/use-cases/sales/price-tables/factories/make-list-price-table-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPriceTableItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/price-tables/:id/items',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRICE_TABLES.ACCESS,
        resource: 'price-tables',
      }),
    ],
    schema: {
      tags: ['Sales - Price Tables'],
      summary: 'List items of a price table',
      params: z.object({
        id: z.string().uuid().describe('Price table UUID'),
      }),
      querystring: listPriceTableItemsQuerySchema,
      response: {
        200: z.object({
          items: z.array(priceTableItemResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: priceTableId } = request.params;
      const {
        page,
        limit,
        variantId: _variantId,
        sortBy,
        sortOrder,
      } = request.query;

      try {
        // Validate price table exists
        const getUseCase = makeGetPriceTableByIdUseCase();
        await getUseCase.execute({ id: priceTableId, tenantId });

        const useCase = makeListPriceTableItemsUseCase();
        const result = await useCase.execute({
          priceTableId,
          tenantId,
          page,
          limit,
          sortBy,
          sortOrder,
        });

        return reply.status(200).send({
          items: result.items,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            pages: result.totalPages,
          },
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
