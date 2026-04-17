import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';
import {
  chartOfAccountResponseSchema,
  createChartOfAccountSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateChartOfAccountUseCase } from '@/use-cases/finance/chart-of-accounts/factories/make-create-chart-of-account-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createChartOfAccountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/chart-of-accounts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CHART_OF_ACCOUNTS.REGISTER,
        resource: 'chart-of-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Chart of Accounts'],
      summary: 'Create a new chart of account',
      security: [{ bearerAuth: [] }],
      body: createChartOfAccountSchema,
      response: {
        201: z.object({ chartOfAccount: chartOfAccountResponseSchema }),
        400: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({
          userId: request.user.sub,
        });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateChartOfAccountUseCase();
        const result = await useCase.execute({ tenantId, ...request.body });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.CHART_OF_ACCOUNT_CREATE,
          entityId: result.chartOfAccount.id,
          placeholders: {
            userName,
            accountName: result.chartOfAccount.name,
          },
          newData: request.body,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({
            code: error.code ?? ErrorCodes.BAD_REQUEST,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
