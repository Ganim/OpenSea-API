import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetChartOfAccountByIdUseCase } from '@/use-cases/finance/chart-of-accounts/factories/make-get-chart-of-account-by-id-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteChartOfAccountUseCase } from '@/use-cases/finance/chart-of-accounts/factories/make-delete-chart-of-account-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function deleteChartOfAccountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/chart-of-accounts/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CHART_OF_ACCOUNTS.REMOVE,
        resource: 'chart-of-accounts',
      }),
    ],
    schema: {
      tags: ['Finance - Chart of Accounts'],
      summary: 'Delete a chart of account (soft delete)',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('No Content'),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const getByIdUseCase = makeGetChartOfAccountByIdUseCase();
        const { chartOfAccount } = await getByIdUseCase.execute({
          tenantId,
          id,
        });

        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({
          userId: request.user.sub,
        });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDeleteChartOfAccountUseCase();
        await useCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.CHART_OF_ACCOUNT_DELETE,
          entityId: chartOfAccount.id,
          placeholders: {
            userName,
            accountName: chartOfAccount.name,
          },
        });

        return reply.status(204).send(null);
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
