import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bankAccountResponseSchema } from '@/http/schemas/finance';
import { makeListBankAccountsUseCase } from '@/use-cases/finance/bank-accounts/factories/make-list-bank-accounts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listBankAccountsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/bank-accounts',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.LIST,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'List bank accounts',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ bankAccounts: z.array(bankAccountResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListBankAccountsUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
