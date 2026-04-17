import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRejectPaymentOrderUseCase } from '@/use-cases/finance/payment-orders/factories/make-reject-payment-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const paymentOrderResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  entryId: z.string(),
  bankAccountId: z.string(),
  method: z.string(),
  amount: z.number(),
  status: z.string(),
  requestedById: z.string(),
  approvedById: z.string().nullable(),
  approvedAt: z.coerce.date().nullable(),
  rejectedReason: z.string().nullable(),
  externalId: z.string().nullable(),
  receiptData: z.record(z.string(), z.unknown()).nullable(),
  recipientData: z.record(z.string(), z.unknown()),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export async function rejectPaymentOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/payment-orders/:id/reject',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_ORDERS.APPROVE,
        resource: 'payment-orders',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Orders'],
      summary: 'Reject a payment order',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        reason: z.string().min(1).max(500),
      }),
      response: {
        200: z.object({ order: paymentOrderResponseSchema }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const { reason } = request.body;

      try {
        const useCase = makeRejectPaymentOrderUseCase();
        const result = await useCase.execute({
          orderId: id,
          tenantId,
          rejectedReason: reason,
        });

        return reply.status(200).send(result);
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
