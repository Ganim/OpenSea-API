import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPosSessionSummaryUseCase } from '@/use-cases/sales/pos-sessions/factories/make-get-pos-session-summary-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paymentBreakdownSchema = z.object({
  method: z.string(),
  total: z.number(),
  count: z.number(),
});

const sessionSummaryResponseSchema = z.object({
  sessionId: z.string(),
  openingBalance: z.number(),
  totalSales: z.number(),
  transactionCount: z.number(),
  cancelledCount: z.number(),
  paymentBreakdown: z.array(paymentBreakdownSchema),
  totalSupplies: z.number(),
  totalWithdrawals: z.number(),
  totalCashReceived: z.number(),
  totalChangeGiven: z.number(),
  expectedCashBalance: z.number(),
});

export async function v1GetSessionSummaryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/sessions/:sessionId/summary',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SESSIONS.ACCESS,
        resource: 'pos-sessions',
      }),
    ],
    schema: {
      tags: ['POS - Sessions'],
      summary:
        'Get session summary with payment breakdown and expected balance',
      params: z.object({ sessionId: z.string().uuid() }),
      response: {
        200: z.object({ summary: sessionSummaryResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { sessionId } = request.params;

      try {
        const useCase = makeGetPosSessionSummaryUseCase();
        const summary = await useCase.execute({ tenantId, sessionId });

        return reply.send({ summary });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
