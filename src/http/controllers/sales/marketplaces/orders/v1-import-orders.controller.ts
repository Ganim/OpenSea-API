import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeImportMarketplaceOrdersUseCase } from '@/use-cases/sales/marketplaces/factories/make-import-marketplace-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ImportOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplace-connections/:connectionId/import/orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_ORDERS.REGISTER,
        resource: 'marketplace-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Integration'],
      summary: 'Import orders from marketplace',
      params: z.object({ connectionId: z.string().uuid() }),
      body: z.object({
        since: z.string().datetime(),
      }),
      response: {
        200: z.object({
          importedOrders: z.array(z.any()),
          skippedCount: z.number(),
          totalFetched: z.number(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const { since } = request.body;

      try {
        const useCase = makeImportMarketplaceOrdersUseCase();
        const result = await useCase.execute({
          tenantId,
          connectionId,
          since: new Date(since),
        });

        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
