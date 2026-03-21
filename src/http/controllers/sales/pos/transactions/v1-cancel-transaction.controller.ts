import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posTransactionResponseSchema } from '@/http/schemas/sales/pos/pos-transaction.schema';
import { posTransactionToDTO } from '@/mappers/sales/pos-transaction/pos-transaction-to-dto';
import { makeCancelPosTransactionUseCase } from '@/use-cases/sales/pos-transactions/factories/make-cancel-pos-transaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CancelTransactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/transactions/:transactionId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TRANSACTIONS.CANCEL,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['POS - Transactions'],
      summary: 'Cancel a POS transaction',
      params: z.object({ transactionId: z.string().uuid() }),
      response: {
        200: z.object({ transaction: posTransactionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { transactionId } = request.params;

      try {
        const useCase = makeCancelPosTransactionUseCase();
        const result = await useCase.execute({ tenantId, transactionId });

        return reply.send({
          transaction: posTransactionToDTO(result.transaction),
        });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
