import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createBankAccountSchema,
  bankAccountResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateBankAccountUseCase } from '@/use-cases/finance/bank-accounts/factories/make-create-bank-account-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createBankAccountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/bank-accounts',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.CREATE,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'Create a new bank account',
      security: [{ bearerAuth: [] }],
      body: createBankAccountSchema,
      response: {
        201: z.object({ bankAccount: bankAccountResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateBankAccountUseCase();
        const result = await useCase.execute({ tenantId, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.BANK_ACCOUNT_CREATE,
          entityId: result.bankAccount.id,
          placeholders: { userName, bankAccountName: result.bankAccount.name },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
