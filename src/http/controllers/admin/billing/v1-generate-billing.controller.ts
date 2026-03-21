import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGenerateBillingUseCase } from '@/use-cases/admin/billing/factories/make-generate-billing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function generateBillingAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/billing/generate',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Billing'],
      summary: 'Generate monthly billing (super admin)',
      description:
        'Generates a monthly billing for a tenant. Requires super admin privileges.',
      body: z.object({
        tenantId: z.string().uuid(),
        referenceMonth: z
          .string()
          .regex(/^\d{4}-\d{2}$/, 'Must be in YYYY-MM format'),
        subscriptionTotal: z.number().min(0),
        consumptionTotal: z.number().min(0),
        discountsTotal: z.number().min(0).optional(),
        dueDate: z.coerce.date(),
        lineItems: z.array(z.unknown()).optional(),
        notes: z.string().optional(),
      }),
      response: {
        201: z.object({
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
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const {
        tenantId,
        referenceMonth,
        subscriptionTotal,
        consumptionTotal,
        discountsTotal,
        dueDate,
        lineItems,
        notes,
      } = request.body;

      try {
        const generateBillingUseCase = makeGenerateBillingUseCase();
        const { billing } = await generateBillingUseCase.execute({
          tenantId,
          referenceMonth,
          subscriptionTotal,
          consumptionTotal,
          discountsTotal,
          dueDate,
          lineItems,
          notes,
        });

        return reply.status(201).send({ billing });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('already exists')
        ) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
