import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListPaymentOrdersUseCase } from '@/use-cases/finance/payment-orders/factories/make-list-payment-orders-use-case';
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

export async function listPaymentOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/payment-orders',
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
      summary: 'List payment orders',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().positive().optional().default(1),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .max(100)
          .optional()
          .default(20),
        status: z
          .enum([
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'PROCESSING',
            'COMPLETED',
            'FAILED',
          ])
          .optional(),
      }),
      response: {
        // P1-43: standardized `{ data, meta }` shape. `orders` kept as
        // transitional alias until the APP migration lands in prod.
        200: z.object({
          data: z.array(paymentOrderResponseSchema),
          orders: z.array(paymentOrderResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status } = request.query;

      const useCase = makeListPaymentOrdersUseCase();
      const result = await useCase.execute({
        tenantId,
        page,
        limit,
        status,
      });

      // P0-30 + P1-43: standard `{ data, meta }` envelope with the legacy
      // `orders` key served in parallel until the APP fully migrates.
      return reply.status(200).send({
        data: result.orders,
        orders: result.orders,
        meta: {
          total: result.total,
          page,
          limit,
          pages: Math.max(1, Math.ceil(result.total / limit)),
        },
      });
    },
  });
}
