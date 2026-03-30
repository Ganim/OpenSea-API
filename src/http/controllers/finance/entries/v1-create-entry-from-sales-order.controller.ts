import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { financeEntryResponseSchema } from '@/http/schemas/finance';
import { makeCreateEntryFromSalesOrderUseCase } from '@/use-cases/finance/entries/factories/make-create-entry-from-sales-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const createEntryFromSalesOrderBodySchema = z.object({
  salesOrderId: z.string().uuid().describe('ID do pedido de venda'),
  customerId: z.string().uuid().optional().describe('ID do cliente'),
  customerName: z.string().max(256).optional().describe('Nome do cliente'),
  totalAmount: z.number().positive().describe('Valor total do pedido'),
  dueDate: z.coerce.date().describe('Data de vencimento'),
  description: z.string().max(500).describe('Descrição do pedido'),
});

export async function createEntryFromSalesOrderController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/entries/from-sales-order',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.REGISTER,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Create a receivable entry from a sales order',
      description:
        'Creates a RECEIVABLE finance entry linked to a sales order. Used for Sales → Finance integration.',
      security: [{ bearerAuth: [] }],
      body: createEntryFromSalesOrderBodySchema,
      response: {
        201: z.object({ entry: financeEntryResponseSchema }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeCreateEntryFromSalesOrderUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.body,
      });

      return reply.status(201).send(result);
    },
  });
}
