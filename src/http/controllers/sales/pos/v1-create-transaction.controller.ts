import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePosTransactionUseCase } from '@/use-cases/sales/pos-transactions/factories/make-create-pos-transaction-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const transactionPaymentSchema = z.object({
  method: z.enum([
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PIX',
    'VOUCHER',
    'CHECK',
    'STORE_CREDIT',
    'PAYMENT_LINK',
    'OTHER',
  ]),
  amount: z.number().positive(),
  receivedAmount: z.number().optional(),
  changeAmount: z.number().optional(),
  installments: z.number().int().positive().optional(),
  authCode: z.string().optional(),
  nsu: z.string().optional(),
  pixTxId: z.string().optional(),
  paymentLinkUrl: z.string().optional(),
  paymentLinkStatus: z.string().optional(),
  tefTransactionId: z.string().optional(),
  notes: z.string().optional(),
});

const createTransactionBodySchema = z.object({
  sessionId: z.string().uuid(),
  orderId: z.string().uuid(),
  subtotal: z.number().min(0),
  discountTotal: z.number().min(0).optional(),
  taxTotal: z.number().min(0).optional(),
  grandTotal: z.number().min(0),
  changeAmount: z.number().min(0).optional(),
  customerId: z.string().uuid().optional(),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  payments: z.array(transactionPaymentSchema).min(1),
});

const transactionResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  orderId: z.string().uuid(),
  transactionNumber: z.number(),
  customerId: z.string().uuid().nullable(),
  status: z.string(),
  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  grandTotal: z.number(),
  changeAmount: z.number(),
  tenantId: z.string().uuid(),
  createdAt: z.string(),
});

export async function createTransactionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/transactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SELL,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Create a new POS transaction (sale)',
      body: createTransactionBodySchema,
      response: {
        201: z.object({ transaction: transactionResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      try {
        const createPosTransactionUseCase = makeCreatePosTransactionUseCase();
        const { transaction } = await createPosTransactionUseCase.execute({
          tenantId,
          sessionId: body.sessionId,
          orderId: body.orderId,
          subtotal: body.subtotal,
          discountTotal: body.discountTotal,
          taxTotal: body.taxTotal,
          grandTotal: body.grandTotal,
          changeAmount: body.changeAmount,
          customerId: body.customerId,
          customerName: body.customerName,
          customerDocument: body.customerDocument,
          payments: body.payments as any,
        });

        const transactionResponse = {
          id: transaction.id.toString(),
          sessionId: transaction.sessionId.toString(),
          orderId: transaction.orderId.toString(),
          transactionNumber: transaction.transactionNumber,
          customerId: transaction.customerId?.toString() ?? null,
          status: transaction.status,
          subtotal: transaction.subtotal,
          discountTotal: transaction.discountTotal,
          taxTotal: transaction.taxTotal,
          grandTotal: transaction.grandTotal,
          changeAmount: transaction.changeAmount,
          tenantId: transaction.tenantId.toString(),
          createdAt: transaction.createdAt.toISOString(),
        };

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.POS_TRANSACTION_CREATE,
          entityId: transactionResponse.id,
          placeholders: {
            userName: userId,
            total: transaction.grandTotal.toFixed(2),
          },
          newData: {
            sessionId: body.sessionId,
            grandTotal: transaction.grandTotal,
          },
        });

        return reply
          .status(201)
          .send({ transaction: transactionResponse } as any);
      } catch (error) {
        if (
          error instanceof BadRequestError ||
          error instanceof ResourceNotFoundError
        ) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
