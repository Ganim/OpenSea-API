import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeMarkBillingPaidUseCase } from '@/use-cases/admin/billing/factories/make-mark-billing-paid-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function markBillingPaidAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/admin/billing/:id/paid',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Mark billing as paid (super admin)',
      description:
        'Marks a billing record as paid with payment method and timestamp. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        paymentMethod: z.string().min(1).max(50),
      }),
      response: {
        200: z.object({
          billing: z.object({
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
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { paymentMethod } = request.body;

      try {
        const markBillingPaidUseCase = makeMarkBillingPaidUseCase();
        const { billing } = await markBillingPaidUseCase.execute({
          billingId: id,
          paymentMethod,
        });

        return reply.status(200).send({ billing });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
