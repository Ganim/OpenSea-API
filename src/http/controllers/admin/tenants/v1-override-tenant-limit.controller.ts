import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeOverrideTenantLimitUseCase } from '@/use-cases/admin/subscriptions/factories/make-override-tenant-limit';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentTenantConsumption } from './presenters';

export async function v1OverrideTenantLimitController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/tenants/:tenantId/limit-override',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Override tenant usage limit (super admin)',
      description:
        'Overrides the usage limit for a specific metric for a tenant. Creates a consumption record if one does not exist.',
      params: z.object({
        tenantId: z.string().uuid(),
      }),
      body: z.object({
        metric: z.string().min(1),
        newLimit: z.number().int().min(0),
        period: z
          .string()
          .regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format')
          .optional(),
      }),
      response: {
        200: z.object({
          consumption: z.record(z.string(), z.unknown()),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;
      const { metric, newLimit, period } = request.body;

      try {
        const overrideTenantLimitUseCase = makeOverrideTenantLimitUseCase();
        const { consumption } = await overrideTenantLimitUseCase.execute({
          tenantId,
          metric,
          newLimit,
          period,
        });

        return reply.status(200).send({
          consumption: presentTenantConsumption(consumption),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
