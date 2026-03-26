import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPriceTablesQuerySchema,
  priceTableResponseSchema,
} from '@/http/schemas';
import { makeListPriceTablesUseCase } from '@/use-cases/sales/price-tables/factories/make-list-price-tables-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPriceTablesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/price-tables',
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
      summary: 'List all price tables',
      querystring: listPriceTablesQuerySchema,
      response: {
        200: z.object({
          priceTables: z.array(priceTableResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, type, isActive, sortBy, sortOrder } =
        request.query;

      const useCase = makeListPriceTablesUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        search,
        type,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        sortBy,
        sortOrder,
      });

      return reply.status(200).send({
        priceTables: result.priceTables,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      });
    },
  });
}
