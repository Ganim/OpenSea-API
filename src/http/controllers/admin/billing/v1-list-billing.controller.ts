import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListBillingUseCase } from '@/use-cases/admin/billing/factories/make-list-billing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listBillingAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/billing',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'List all billing records (super admin)',
      description:
        'Lists all billing records with optional status filter. Requires super admin privileges.',
      querystring: z.object({
        status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
      }),
      response: {
        200: z.object({
          billings: z.array(
            z.object({
              id: z.string(),
              tenantId: z.string(),
              period: z.string(),
              subscriptionTotal: z.number(),
              consumptionTotal: z.number(),
              discountsTotal: z.number(),
              totalAmount: z.number(),
              status: z.string(),
              dueDate: z.coerce.date(),
              paidAt: z.coerce.date().nullable(),
              paymentMethod: z.string().nullable(),
              invoiceUrl: z.string().nullable(),
              lineItems: z.array(z.unknown()),
              notes: z.string().nullable(),
              createdAt: z.coerce.date(),
            }),
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { status } = request.query;

      const listBillingUseCase = makeListBillingUseCase();
      const { billings } = await listBillingUseCase.execute({ status });

      return reply.status(200).send({ billings });
    },
  });
}
