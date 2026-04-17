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
  updateBankAccountApiConfigSchema,
  bankAccountResponseSchema,
} from '@/http/schemas/finance';
import { makeGetBankAccountByIdUseCase } from '@/use-cases/finance/bank-accounts/factories/make-get-bank-account-by-id-use-case';
import { makeUpdateBankAccountApiConfigUseCase } from '@/use-cases/finance/bank-accounts/factories/make-update-bank-account-api-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateBankAccountApiConfigController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/bank-accounts/:id/api-config',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BANK_ACCOUNTS.ADMIN,
        resource: 'bank-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Bank Accounts'],
      summary: 'Save banking API credentials for a bank account',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: updateBankAccountApiConfigSchema,
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
        const { bankAccount: oldBankAccount } =
          await makeGetBankAccountByIdUseCase().execute({
            tenantId,
            id,
          });

        const useCase = makeUpdateBankAccountApiConfigUseCase();
        const result = await useCase.execute({
          tenantId,
          bankAccountId: id,
          userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.BANK_ACCOUNT_API_CONFIG_UPDATE,
          entityId: id,
          placeholders: {
            userName: userId,
            bankAccountName: result.bankAccount.name,
          },
          oldData: { apiProvider: oldBankAccount.name },
          newData: {
            apiProvider: request.body.apiProvider,
            apiClientId: request.body.apiClientId,
            apiEnabled: request.body.apiEnabled,
          },
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
