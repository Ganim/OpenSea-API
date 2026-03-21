import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const transactionItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
});

const transactionPaymentSchema = z.object({
  method: z.enum(['CASH', 'CREDIT', 'DEBIT', 'PIX', 'VOUCHER', 'OTHER']),
  amount: z.number().positive(),
  reference: z.string().optional(),
});

const createTransactionBodySchema = z.object({
  sessionId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(transactionItemSchema).min(1),
  payments: z.array(transactionPaymentSchema).min(1),
  notes: z.string().max(500).optional(),
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

      // TODO: Replace stub with real use case
      const subtotal = body.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const discount = body.items.reduce((sum, i) => sum + (i.discount ?? 0), 0);

      const transaction = {
        id: crypto.randomUUID(),
        sessionId: body.sessionId,
        customerId: body.customerId ?? null,
        operatorId: userId,
        status: 'COMPLETED',
        subtotal,
        discount,
        total: subtotal - discount,
        notes: body.notes ?? null,
        tenantId,
        createdAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: 'POS transaction created: R$ {total}',
        entityId: transaction.id,
        placeholders: { userName: userId, total: transaction.total.toFixed(2) },
        newData: {
          sessionId: body.sessionId,
          itemCount: body.items.length,
          total: transaction.total,
        },
      });

      return reply.status(201).send({ transaction });
    },
  });
}
