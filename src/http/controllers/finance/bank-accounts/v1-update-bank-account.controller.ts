import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  updateBankAccountSchema,
  bankAccountResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetBankAccountByIdUseCase } from '@/use-cases/finance/bank-accounts/factories/make-get-bank-account-by-id-use-case';
import { makeUpdateBankAccountUseCase } from '@/use-cases/finance/bank-accounts/factories/make-update-bank-account-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateBankAccountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/bank-accounts/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.MODIFY,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'Update a bank account',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateBankAccountSchema,
      response: {
        200: z.object({ bankAccount: bankAccountResponseSchema }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const [{ user }, oldData] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetBankAccountByIdUseCase().execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeUpdateBankAccountUseCase();
        const result = await useCase.execute({ tenantId, id, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.BANK_ACCOUNT_UPDATE,
          entityId: id,
          placeholders: { userName, bankAccountName: result.bankAccount.name },
          oldData: { ...oldData.bankAccount },
          newData: request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
