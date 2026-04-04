import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import {
  posPaymentMethodEnum,
  posTransactionResponseSchema,
} from '@/http/schemas/sales/pos/pos-transaction.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { posTransactionToDTO } from '@/mappers/sales/pos-transaction/pos-transaction-to-dto';
import { makeReceivePaymentUseCase } from '@/use-cases/sales/orders/factories/make-receive-payment-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const terminalModeEnum = z.enum(['STANDARD', 'FAST_CHECKOUT']);

const receivePaymentBodySchema = z.object({
  terminalMode: terminalModeEnum,
  posSessionId: z.string().uuid().optional(),
  expectedVersion: z.number().int().min(0),
  payments: z
    .array(
      z.object({
        method: posPaymentMethodEnum,
        amount: z.number().positive(),
        receivedAmount: z.number().optional(),
        installments: z.number().int().min(1).optional(),
        authCode: z.string().optional(),
        nsu: z.string().optional(),
        pixTxId: z.string().optional(),
      }),
    )
    .min(1),
});

export async function v1ReceivePaymentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/orders/:id/receive-payment',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.RECEIVE,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Receive payment for an order and complete the sale',
      params: z.object({ id: z.string().uuid() }),
      body: receivePaymentBodySchema,
      response: {
        200: z.object({
          order: orderResponseSchema,
          posTransaction: posTransactionResponseSchema,
          changeAmount: z.number(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: orderId } = request.params;
      const { terminalMode, posSessionId, expectedVersion, payments } =
        request.body;

      // Check if user has override permission
      const hasOverridePermission = request.user.permissions?.includes(
        PermissionCodes.SALES.POS.OVERRIDE,
      );

      try {
        const useCase = makeReceivePaymentUseCase();
        const result = await useCase.execute({
          tenantId,
          orderId,
          userId,
          terminalMode,
          posSessionId,
          expectedVersion,
          hasOverridePermission,
          payments,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PDV_PAYMENT_RECEIVED,
          entityId: orderId,
          placeholders: {
            userName: userId,
            total: result.order.grandTotal.toFixed(2),
            saleCode: result.order.saleCode ?? '',
          },
          newData: {
            terminalMode,
            posSessionId,
            changeAmount: result.changeAmount,
            paymentCount: payments.length,
          },
        });

        return reply.send({
          order: orderToDTO(result.order),
          posTransaction: posTransactionToDTO(result.posTransaction),
          changeAmount: result.changeAmount,
        });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        if (err instanceof ConflictError) {
          return reply.status(409).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
