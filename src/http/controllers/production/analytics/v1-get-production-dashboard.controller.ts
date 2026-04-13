import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetProductionDashboardUseCase } from '@/use-cases/production/analytics/factories/make-get-production-dashboard-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getProductionDashboardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/analytics/dashboard',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ANALYTICS.ACCESS,
        resource: 'production-analytics',
      }),
    ],
    schema: {
      tags: ['Production - Analytics'],
      summary: 'Get production dashboard metrics',
      response: {
        200: z.object({
          orderCounts: z.record(z.string(), z.number()),
          totalOrders: z.number(),
          activeOrders: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const getProductionDashboardUseCase = makeGetProductionDashboardUseCase();
      const { orderCounts, totalOrders, activeOrders } =
        await getProductionDashboardUseCase.execute({ tenantId });

      return reply.status(200).send({
        orderCounts,
        totalOrders,
        activeOrders,
      });
    },
  });
}
