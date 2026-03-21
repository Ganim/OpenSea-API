import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { dashboardResponseSchema } from '@/http/schemas/finance';
import { makeGetFinanceDashboardUseCase } from '@/use-cases/finance/dashboard/factories/make-get-finance-dashboard-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getFinanceDashboardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'dashboard',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary: 'Get finance dashboard summary',
      security: [{ bearerAuth: [] }],
      response: {
        200: dashboardResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetFinanceDashboardUseCase();
      const result = await useCase.execute({ tenantId });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(result);
    },
  });
}
