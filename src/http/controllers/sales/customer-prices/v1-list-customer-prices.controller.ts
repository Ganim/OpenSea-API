import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  customerPriceResponseSchema,
  listCustomerPricesQuerySchema,
} from '@/http/schemas';
import { makeListCustomerPricesUseCase } from '@/use-cases/sales/customer-prices/factories/make-list-customer-prices-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCustomerPricesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/customer-prices',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CUSTOMER_PRICES.ACCESS,
        resource: 'customer-prices',
      }),
    ],
    schema: {
      tags: ['Sales - Customer Prices'],
      summary: 'List customer-specific prices',
      querystring: listCustomerPricesQuerySchema,
      response: {
        200: z.object({
          customerPrices: z.array(customerPriceResponseSchema),
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
      const { page, limit, customerId, variantId, sortBy, sortOrder } =
        request.query;

      const useCase = makeListCustomerPricesUseCase();
      const result = await useCase.execute({
        tenantId,
        customerId: customerId ?? '',
        page,
        limit,
        sortBy,
        sortOrder,
      });

      return reply.status(200).send({
        customerPrices: result.customerPrices,
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
