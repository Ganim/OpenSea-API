import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetCashierSessionReportUseCase } from '@/use-cases/sales/cashier/factories/make-get-cashier-session-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCashierSessionReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/cashier/sessions/:sessionId/report',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.ACCESS,
        resource: 'cashier',
      }),
    ],
    schema: {
      tags: ['Sales - Cashier'],
      summary: 'Get consolidated cashier session report',
      params: z.object({
        sessionId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          sessionId: z.string().uuid(),
          status: z.enum(['OPEN', 'CLOSED', 'RECONCILED']),
          openingBalance: z.number(),
          closingBalance: z.number().optional(),
          expectedBalance: z.number().optional(),
          difference: z.number().optional(),
          totals: z.object({
            sales: z.number(),
            refunds: z.number(),
            cashIn: z.number(),
            cashOut: z.number(),
            netSales: z.number(),
            transactions: z.number(),
          }),
          paymentMethods: z.array(
            z.object({
              method: z.string(),
              amount: z.number(),
              count: z.number(),
            }),
          ),
          hourlySales: z.array(
            z.object({
              hour: z.number(),
              amount: z.number(),
            }),
          ),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { sessionId } = request.params;

      try {
        const useCase = makeGetCashierSessionReportUseCase();
        const result = await useCase.execute({ tenantId, sessionId });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  });
}
