import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListPosTransactionsUseCase } from '@/use-cases/sales/pos-transactions/factories/make-list-pos-transactions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sessionId: z.string().uuid().optional(),
  status: z
    .enum(['COMPLETED', 'CANCELLED', 'SUSPENDED', 'PENDING_SYNC'])
    .optional(),
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

export async function listTransactionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/transactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ACCESS,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'List POS transactions',
      querystring: listTransactionsQuerySchema,
      response: {
        200: z.object({
          transactions: z.array(transactionResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, sessionId, status } = request.query;

      const listPosTransactionsUseCase = makeListPosTransactionsUseCase();
      const { transactions, total, totalPages } =
        await listPosTransactionsUseCase.execute({
          tenantId,
          page,
          limit,
          sessionId,
          status,
        });

      const transactionResponses = transactions.map((transaction) => ({
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
      }));

      return reply.status(200).send({
        transactions: transactionResponses,
        meta: { total, page, limit, pages: totalPages },
      } as any);
    },
  });
}
