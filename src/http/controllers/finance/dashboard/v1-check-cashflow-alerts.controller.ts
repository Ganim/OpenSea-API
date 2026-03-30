import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cashFlowAlertsResponseSchema } from '@/http/schemas/finance';
import { makeCheckCashFlowAlertsUseCase } from '@/use-cases/finance/alerts/factories/make-check-cashflow-alerts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function checkCashFlowAlertsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/alerts/cashflow',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Dashboard'],
      summary: 'Check cash flow alerts and 7-day balance projection',
      description:
        'Analyzes current bank balances, pending payables and receivables to generate alerts for negative balance, low balance, and large outflows in the next 7 days.',
      security: [{ bearerAuth: [] }],
      response: {
        200: cashFlowAlertsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeCheckCashFlowAlertsUseCase();
      const { alerts, nextSevenDays } = await useCase.execute({ tenantId });

      // Convert Date objects to ISO strings for JSON serialization
      const serializedAlerts = alerts.map((alert) => ({
        ...alert,
        projectedDate: alert.projectedDate.toISOString(),
      }));

      return reply.status(200).send({
        alerts: serializedAlerts,
        nextSevenDays,
      });
    },
  });
}
