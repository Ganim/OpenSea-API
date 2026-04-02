import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCancelPosTransactionUseCase } from '@/use-cases/sales/pos-transactions/factories/make-cancel-pos-transaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const cancelTransactionBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export async function cancelTransactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/transactions/:transactionId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.CANCEL,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Cancel a POS transaction',
      params: z.object({
        transactionId: z.string().uuid().describe('Transaction UUID'),
      }),
      body: cancelTransactionBodySchema,
      response: {
        200: z.object({
          transaction: z.object({
            id: z.string().uuid(),
            status: z.string(),
            cancelledAt: z.string(),
            cancelReason: z.string(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { transactionId } = request.params;
      const { reason } = request.body;

      try {
        const cancelPosTransactionUseCase = makeCancelPosTransactionUseCase();
        const { transaction } = await cancelPosTransactionUseCase.execute({
          tenantId,
          transactionId,
        });

        const transactionResponse = {
          id: transaction.id.toString(),
          status: transaction.status,
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
        };

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.POS_TRANSACTION_CANCEL,
          entityId: transactionId,
          placeholders: { userName: userId, transactionId },
          newData: { reason },
        });

        return reply
          .status(200)
          .send({ transaction: transactionResponse } as unknown);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
