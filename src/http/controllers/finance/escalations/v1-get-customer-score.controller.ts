import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCalculateCustomerScoreUseCase } from '@/use-cases/finance/escalations/factories/make-calculate-customer-score-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getCustomerScoreController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/customers/:customerName/score',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'Get customer payment reliability score',
      security: [{ bearerAuth: [] }],
      params: z.object({
        customerName: z.string().min(1),
      }),
      response: {
        200: z.object({
          customerName: z.string(),
          score: z.number(),
          rating: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
          avgDaysToPayment: z.number(),
          onTimeRate: z.number(),
          lateRate: z.number(),
          veryLateRate: z.number(),
          currentOverdue: z.number(),
          currentOverdueValue: z.number(),
          totalEntries: z.number(),
          totalValue: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { customerName } = request.params;

      const useCase = makeCalculateCustomerScoreUseCase();
      const result = await useCase.execute({
        tenantId,
        customerName: decodeURIComponent(customerName),
      });

      return reply.status(200).send(result);
    },
  });
}
