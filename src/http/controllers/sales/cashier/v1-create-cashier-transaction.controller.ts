import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cashierTransactionResponseSchema,
  createCashierTransactionSchema,
} from '@/http/schemas/sales/cashier/cashier.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateCashierTransactionUseCase } from '@/use-cases/sales/cashier/factories/make-create-cashier-transaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createCashierTransactionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/cashier-sessions/:id/transactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CASHIER.RECEIVE,
        resource: 'cashier',
      }),
    ],
    schema: {
      tags: ['Sales - Cashier'],
      summary: 'Create a transaction in a cashier session',
      params: z.object({ id: z.string().uuid() }),
      body: createCashierTransactionSchema,
      response: {
        201: z.object({ transaction: cashierTransactionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const body = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateCashierTransactionUseCase();
        const { transaction } = await useCase.execute({
          tenantId,
          sessionId: id,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.CASHIER_TRANSACTION_CREATE,
          entityId: transaction.id,
          placeholders: { userName },
          newData: {
            type: body.type,
            amount: body.amount,
            paymentMethod: body.paymentMethod,
          },
        });

        return reply.status(201).send({ transaction } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
