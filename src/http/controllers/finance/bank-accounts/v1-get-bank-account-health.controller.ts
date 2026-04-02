import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { makeGetBankAccountHealthUseCase } from '@/use-cases/finance/bank-accounts/factories/make-get-bank-account-health-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getBankAccountHealthController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/bank-accounts/:id/health',
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'Health check for bank API connection (mTLS, OAuth, balance)',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          health: z.object({
            provider: z.string(),
            status: z.enum(['healthy', 'degraded', 'unhealthy']),
            latencyMs: z.number(),
            checks: z.object({
              auth: z.object({
                ok: z.boolean(),
                error: z.string().optional(),
              }),
              balance: z.object({
                ok: z.boolean(),
                error: z.string().optional(),
              }),
              timestamp: z.string(),
            }),
            sandbox: z.boolean(),
          }),
        }),
      },
    },
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ADMIN,
      }),
    ],
    handler: async (request, reply) => {
      const { id } = request.params;
      const useCase = makeGetBankAccountHealthUseCase();

      const result = await useCase.execute({
        tenantId: request.tenantId,
        bankAccountId: id,
      });

      return reply.status(200).send(result);
    },
  });
}
