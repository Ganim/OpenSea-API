import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createPosTransactionSchema,
  posTransactionResponseSchema,
  posTransactionPaymentResponseSchema,
} from '@/http/schemas/sales/pos/pos-transaction.schema';
import { posTransactionToDTO } from '@/mappers/sales/pos-transaction/pos-transaction-to-dto';
import { posTransactionPaymentToDTO } from '@/mappers/sales/pos-transaction-payment/pos-transaction-payment-to-dto';
import { makeCreatePosTransactionUseCase } from '@/use-cases/sales/pos-transactions/factories/make-create-pos-transaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateTransactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/transactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TRANSACTIONS.REGISTER,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['POS - Transactions'],
      summary: 'Create a POS transaction (sale)',
      body: createPosTransactionSchema,
      response: {
        201: z.object({
          transaction: posTransactionResponseSchema,
          payments: z.array(posTransactionPaymentResponseSchema),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreatePosTransactionUseCase();
        const result = await useCase.execute({ tenantId, ...data });

        return reply.status(201).send({
          transaction: posTransactionToDTO(result.transaction),
          payments: result.payments.map(posTransactionPaymentToDTO),
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
