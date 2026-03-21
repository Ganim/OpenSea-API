import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetTenantBillingUseCase } from '@/use-cases/admin/billing/factories/make-get-tenant-billing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getTenantBillingAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/billing/:tenantId',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Get billing history for a tenant (super admin)',
      description:
        'Returns all billing records for a specific tenant. Requires super admin privileges.',
      params: z.object({
        tenantId: z.string().uuid(),
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
      const { tenantId } = request.params;

      const getTenantBillingUseCase = makeGetTenantBillingUseCase();
      const { billings } = await getTenantBillingUseCase.execute({ tenantId });

      return reply.status(200).send({ billings });
    },
  });
}
