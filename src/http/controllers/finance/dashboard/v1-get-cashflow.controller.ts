import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cashflowQuerySchema,
  cashflowResponseSchema,
} from '@/http/schemas/finance';
import { makeGetCashflowUseCase } from '@/use-cases/finance/dashboard/factories/make-get-cashflow-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function getCashflowController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/cashflow',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.DASHBOARD.VIEW,
        resource: 'dashboard',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary: 'Get cashflow analysis (inflow vs outflow by period)',
      security: [{ bearerAuth: [] }],
      querystring: cashflowQuerySchema,
      response: {
        200: cashflowResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query as {
        startDate: Date;
        endDate: Date;
        groupBy: 'day' | 'week' | 'month';
        bankAccountId?: string;
      };

      const useCase = makeGetCashflowUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.status(200).send(result);
    },
  });
}
