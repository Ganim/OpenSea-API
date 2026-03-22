import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListMarketplacePaymentsUseCase } from '@/use-cases/sales/marketplace-payments/factories/make-list-marketplace-payments-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListMarketplacePaymentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-payments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_PAYMENTS.ACCESS,
        resource: 'marketplace-payments',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Payments'],
      summary: 'List marketplace payments',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        connectionId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          payments: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, connectionId } = request.query;
      const useCase = makeListMarketplacePaymentsUseCase();
      const result = await useCase.execute({ tenantId, connectionId, page, perPage });
      return reply.status(200).send(result);
    },
  });
}
