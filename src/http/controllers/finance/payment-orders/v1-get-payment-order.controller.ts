import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetPaymentOrderUseCase } from '@/use-cases/finance/payment-orders/factories/make-get-payment-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

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

export async function getPaymentOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/payment-orders/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_ORDERS.ACCESS,
        resource: 'payment-orders',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Orders'],
      summary: 'Get a payment order by ID',
      security: [{ bearerAuth: [] }],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ order: paymentOrderResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      try {
        const useCase = makeGetPaymentOrderUseCase();
        const result = await useCase.execute({ orderId: id, tenantId });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
