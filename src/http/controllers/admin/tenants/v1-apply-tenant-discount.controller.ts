import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeApplyTenantDiscountUseCase } from '@/use-cases/admin/subscriptions/factories/make-apply-tenant-discount';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentTenantSubscription } from './presenters';

export async function v1ApplyTenantDiscountController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/tenants/:tenantId/discount',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Apply discount to tenant subscription (super admin)',
      description:
        'Applies a discount percentage to a specific skill subscription for a tenant.',
      params: z.object({
        tenantId: z.string().uuid(),
      }),
      body: z.object({
        skillCode: z.string().min(1),
        discountPercent: z.number().min(0).max(100),
        notes: z.string().max(500).optional(),
      }),
      response: {
        200: z.object({
          subscription: z.record(z.string(), z.unknown()),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;
      const { skillCode, discountPercent, notes } = request.body;

      try {
        const applyTenantDiscountUseCase = makeApplyTenantDiscountUseCase();
        const { subscription } = await applyTenantDiscountUseCase.execute({
          tenantId,
          skillCode,
          discountPercent,
          notes,
        });

        return reply.status(200).send({
          subscription: presentTenantSubscription(subscription),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
