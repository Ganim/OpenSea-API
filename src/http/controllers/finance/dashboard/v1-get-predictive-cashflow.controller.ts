import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  predictiveCashflowQuerySchema,
  predictiveCashflowResponseSchema,
} from '@/http/schemas/finance';
import { makeGetPredictiveCashflowUseCase } from '@/use-cases/finance/dashboard/factories/make-get-predictive-cashflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getPredictiveCashflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/analytics/predictive-cashflow',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'analytics',
      }),
    ],
    schema: {
      tags: ['Finance - Analytics'],
      summary:
        'Get predictive cashflow with seasonal patterns and danger zone detection',
      security: [{ bearerAuth: [] }],
      querystring: predictiveCashflowQuerySchema,
      response: {
        200: predictiveCashflowResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as { months: number };

      const useCase = makeGetPredictiveCashflowUseCase();
      const result = await useCase.execute({
        tenantId,
        months: query.months,
      });

      reply.header('Cache-Control', 'private, max-age=60');
      return reply.status(200).send(result);
    },
  });
}
