import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListMarketplaceConnectionsUseCase } from '@/use-cases/sales/marketplace-connections/factories/make-list-marketplace-connections-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListConnectionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.ACCESS,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Connections'],
      summary: 'List marketplace connections',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          connections: z.array(z.any()),
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
      const { page, perPage } = request.query;
      const useCase = makeListMarketplaceConnectionsUseCase();
      const result = await useCase.execute({ tenantId, page, perPage });
      return reply.status(200).send(result);
    },
  });
}
