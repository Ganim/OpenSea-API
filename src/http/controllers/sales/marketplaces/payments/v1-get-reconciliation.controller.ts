import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetMarketplaceReconciliationUseCase } from '@/use-cases/sales/marketplace-payments/factories/make-get-marketplace-reconciliation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetReconciliationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-connections/:connectionId/reconciliation',
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
      summary: 'Get reconciliation summary for a connection',
      params: z.object({ connectionId: z.string().uuid() }),
      response: {
        200: z.object({
          connectionId: z.string(),
          connectionName: z.string(),
          marketplace: z.string(),
          totalGross: z.number(),
          totalFees: z.number(),
          totalNet: z.number(),
          pendingCount: z.number(),
          settledCount: z.number(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      try {
        const useCase = makeGetMarketplaceReconciliationUseCase();
        const result = await useCase.execute({ tenantId, connectionId });
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
