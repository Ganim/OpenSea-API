import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posPaymentMethodEnum } from '@/http/schemas/sales/pos/pos-transaction.schema';
import { makeCreatePaymentChargeUseCase } from '@/use-cases/sales/payment/factories/make-create-payment-charge-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createChargeBodySchema = z.object({
  orderId: z.string().uuid(),
  orderNumber: z.string().min(1),
  method: posPaymentMethodEnum,
  amount: z.number().positive(),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  description: z.string().optional(),
  installments: z.number().int().min(1).optional(),
  expiresInMinutes: z.number().int().min(1).optional(),
});

const paymentChargeResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderId: z.string(),
  provider: z.string(),
  providerChargeId: z.string().nullable().optional(),
  method: z.string(),
  amount: z.number(),
  status: z.string(),
  qrCode: z.string().nullable().optional(),
  checkoutUrl: z.string().nullable().optional(),
  boletoUrl: z.string().nullable().optional(),
  boletoBarcode: z.string().nullable().optional(),
  paidAt: z.string().datetime().nullable().optional(),
  paidAmount: z.number().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export async function v1CreateChargeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/payments/charges',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.RECEIVE,
        resource: 'payment-charges',
      }),
    ],
    schema: {
      tags: ['Payment Gateway'],
      summary: 'Create a payment charge via the configured gateway',
      body: createChargeBodySchema,
      response: {
        201: z.object({ paymentCharge: paymentChargeResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const {
        orderId,
        orderNumber,
        method,
        amount,
        customerName,
        customerDocument,
        description,
        installments,
        expiresInMinutes,
      } = request.body;

      try {
        const useCase = makeCreatePaymentChargeUseCase();
        const { paymentCharge } = await useCase.execute({
          tenantId,
          orderId,
          orderNumber,
          method,
          amount,
          customerName,
          customerDocument,
          description,
          installments,
          expiresInMinutes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.PAYMENT_CHARGE_CREATED,
          entityId: paymentCharge.id,
          placeholders: {
            userName: userId,
            amount: amount.toFixed(2),
            provider: paymentCharge.provider,
            method,
          },
          newData: {
            orderId,
            method,
            amount,
            provider: paymentCharge.provider,
            status: paymentCharge.status,
          },
        });

        return reply.status(201).send({ paymentCharge });
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
