import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeSuggestPaymentTimingUseCase } from '@/use-cases/finance/analytics/factories/make-suggest-payment-timing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getPaymentTimingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/analytics/payment-timing',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Analytics'],
      summary: 'Get smart payment timing suggestions',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        daysAhead: z.coerce.number().min(1).max(90).optional().default(30),
      }),
      response: {
        200: z.object({
          suggestions: z.array(
            z.object({
              entryId: z.string(),
              supplierName: z.string(),
              amount: z.number(),
              currentDueDate: z.string(),
              suggestedPayDate: z.string(),
              reason: z.string(),
              savingsAmount: z.number(),
              priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
              type: z.enum(['EARLY_DISCOUNT', 'DELAY_SAFE', 'PENALTY_RISK']),
            }),
          ),
          totalPotentialSavings: z.number(),
          analyzedEntries: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { daysAhead } = request.query;

      const useCase = makeSuggestPaymentTimingUseCase();
      const result = await useCase.execute({ tenantId, daysAhead });

      return reply.status(200).send(result);
    },
  });
}
