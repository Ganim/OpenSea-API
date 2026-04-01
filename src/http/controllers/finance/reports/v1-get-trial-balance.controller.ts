import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { trialBalanceQuerySchema } from '@/http/schemas/finance';
import { makeGetTrialBalanceUseCase } from '@/use-cases/finance/journal-entries/factories/make-get-trial-balance-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const trialBalanceAccountSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.string(),
  nature: z.string(),
  level: z.number(),
  debitTotal: z.number(),
  creditTotal: z.number(),
  balance: z.number(),
});

export async function getTrialBalanceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reports/trial-balance',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.REPORTS.ACCESS,
        resource: 'reports',
      }),
    ],
    schema: {
      tags: ['Finance - Reports'],
      summary: 'Get trial balance (Balancete)',
      security: [{ bearerAuth: [] }],
      querystring: trialBalanceQuerySchema,
      response: {
        200: z.object({
          period: z.object({ from: z.coerce.date(), to: z.coerce.date() }),
          accounts: z.array(trialBalanceAccountSchema),
          totals: z.object({
            debit: z.number(),
            credit: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { from, to } = request.query;

      const useCase = makeGetTrialBalanceUseCase();
      const result = await useCase.execute({ tenantId, from, to });

      return reply.status(200).send(result);
    },
  });
}
