import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  reconciliationResponseSchema,
  reconciliationQuerySchema,
} from '@/http/schemas/sales/marketplaces';
import { makeGetMarketplaceReconciliationUseCase } from '@/use-cases/sales/marketplaces/factories/make-get-marketplace-reconciliation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getReconciliationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections/:connectionId/reconciliation',
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
      summary: 'Get payment reconciliation for a marketplace connection',
      params: z.object({
        connectionId: z.string().uuid().describe('Connection UUID'),
      }),
      querystring: reconciliationQuerySchema,
      response: {
        200: z.object({
          reconciliation: reconciliationResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const query = request.query;

      const useCase = makeGetMarketplaceReconciliationUseCase();
      const { reconciliation } = await useCase.execute({
        tenantId,
        connectionId,
        from: query.from,
        to: query.to,
      });

      return reply.status(200).send({ reconciliation });
    },
  });
}
