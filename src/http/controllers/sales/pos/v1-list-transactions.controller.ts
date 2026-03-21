import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sessionId: z.string().uuid().optional(),
  operatorId: z.string().uuid().optional(),
  status: z.enum(['COMPLETED', 'CANCELLED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

const transactionResponseSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  customerId: z.string().uuid().nullable(),
  operatorId: z.string().uuid(),
  status: z.string(),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  notes: z.string().nullable(),
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
      const { page, limit } = request.query;

      // TODO: Replace stub with real use case
      return reply.status(200).send({
        transactions: [],
        meta: { total: 0, page, limit, pages: 0 },
      });
    },
  });
}
