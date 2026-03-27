import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { financialHealthResponseSchema } from '@/http/schemas/finance';
import { makeCalculateFinancialHealthUseCase } from '@/use-cases/finance/dashboard/factories/make-calculate-financial-health-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getFinancialHealthController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/dashboard/health-score',
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
      summary: 'Calculate financial health score',
      description:
        'Calculates a 0-100 score based on 5 dimensions: liquidity, delinquency, predictability, diversification, and growth.',
      security: [{ bearerAuth: [] }],
      response: {
        200: financialHealthResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeCalculateFinancialHealthUseCase();
      const healthScore = await useCase.execute({ tenantId });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(healthScore);
    },
  });
}
