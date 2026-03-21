import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  connectionResponseSchema,
  listConnectionsQuerySchema,
} from '@/http/schemas/sales/marketplaces';
import { makeListMarketplaceConnectionsUseCase } from '@/use-cases/sales/marketplaces/factories/make-list-marketplace-connections-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listConnectionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_CONNECTIONS.ACCESS,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'List marketplace connections',
      querystring: listConnectionsQuerySchema,
      response: {
        200: z.object({
          connections: z.array(connectionResponseSchema),
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
      const query = request.query;

      const useCase = makeListMarketplaceConnectionsUseCase();
      const { connections, total, totalPages } = await useCase.execute({
        tenantId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        platform: query.platform,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        connections,
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
