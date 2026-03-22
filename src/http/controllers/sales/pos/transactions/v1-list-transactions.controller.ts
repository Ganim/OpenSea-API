import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { posTransactionResponseSchema } from '@/http/schemas/sales/pos/pos-transaction.schema';
import { posTransactionToDTO } from '@/mappers/sales/pos-transaction/pos-transaction-to-dto';
import { makeListPosTransactionsUseCase } from '@/use-cases/sales/pos-transactions/factories/make-list-pos-transactions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListTransactionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/transactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.TRANSACTIONS.ACCESS,
        resource: 'pos-transactions',
      }),
    ],
    schema: {
      tags: ['POS - Transactions'],
      summary: 'List POS transactions',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sessionId: z.string().uuid().optional(),
        status: z.string().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(posTransactionResponseSchema),
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
      const query = request.query;

      const useCase = makeListPosTransactionsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.send({
        data: result.transactions.map(posTransactionToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      });
    },
  });
}
