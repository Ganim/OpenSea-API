import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  marketplacePaymentResponseSchema,
  listPaymentsQuerySchema,
} from '@/http/schemas/sales/marketplaces';
import { makeListMarketplacePaymentsUseCase } from '@/use-cases/sales/marketplaces/factories/make-list-marketplace-payments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPaymentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections/:connectionId/payments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_PAYMENTS.ACCESS,
        resource: 'marketplace-payments',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'List payments for a marketplace connection',
      params: z.object({
        connectionId: z.string().uuid().describe('Connection UUID'),
      }),
      querystring: listPaymentsQuerySchema,
      response: {
        200: z.object({
          payments: z.array(marketplacePaymentResponseSchema),
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
      const { connectionId } = request.params;
      const query = request.query;

      const useCase = makeListMarketplacePaymentsUseCase();
      const { payments, total, totalPages } = await useCase.execute({
        tenantId,
        connectionId,
        page: query.page,
        limit: query.limit,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        payments,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          pages: totalPages,
        },
      });
    },
  });
}
