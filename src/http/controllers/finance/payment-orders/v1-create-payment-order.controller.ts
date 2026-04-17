import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePaymentOrderUseCase } from '@/use-cases/finance/payment-orders/factories/make-create-payment-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

const createPaymentOrderBodySchema = z.object({
  entryId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  method: z.enum(['PIX', 'TED', 'BOLETO']),
  amount: z.number().positive(),
  recipientData: z.record(z.string(), z.unknown()),
});

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

export async function createPaymentOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/payment-orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.PAYMENT_ORDERS.REGISTER,
        resource: 'payment-orders',
      }),
    ],
    schema: {
      tags: ['Finance - Payment Orders'],
      summary: 'Create a new payment order',
      security: [{ bearerAuth: [] }],
      body: createPaymentOrderBodySchema,
      response: {
        201: z.object({ order: paymentOrderResponseSchema }),
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const requestedById = request.user.sub;

      try {
        const useCase = makeCreatePaymentOrderUseCase();
        const result = await useCase.execute({
          tenantId,
          requestedById,
          ...request.body,
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
