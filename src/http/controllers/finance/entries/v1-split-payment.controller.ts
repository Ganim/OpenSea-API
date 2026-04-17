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
  splitPaymentBodySchema,
  splitPaymentResponseSchema,
} from '@/http/schemas/finance';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeSplitPaymentUseCase } from '@/use-cases/finance/entries/factories/make-split-payment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function splitPaymentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/split-payment',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MODIFY,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Split payment across multiple finance entries',
      description:
        'Distribute a single payment amount across multiple entries. Each allocation can be partial or full. All operations are atomic.',
      security: [{ bearerAuth: [] }],
      body: splitPaymentBodySchema,
      response: {
        201: splitPaymentResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
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

        const useCase = makeSplitPaymentUseCase();
        const result = await useCase.execute({
          tenantId,
          createdBy: userId,
          ...request.body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.FINANCE.FINANCE_ENTRY_SPLIT_PAYMENT,
          entityId: request.body.allocations[0].entryId,
          placeholders: {
            userName,
            amount: request.body.paymentAmount.toString(),
            count: request.body.allocations.length.toString(),
          },
          newData: {
            paymentAmount: request.body.paymentAmount,
            allocations: request.body.allocations,
            fullyPaidEntryIds: result.fullyPaidEntryIds,
            partialEntryIds: result.partialEntryIds,
          },
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
