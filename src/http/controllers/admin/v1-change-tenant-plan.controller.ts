import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeChangeTenantPlanUseCase } from '@/use-cases/admin/tenants/factories/make-change-tenant-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeTenantPlanAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/tenants/:id/plan',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Change tenant plan (super admin)',
      description:
        'Changes the subscription plan of a tenant. The plan determines the features and limits available to the tenant. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        planId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          tenantPlan: z.object({
            id: z.string(),
            tenantId: z.string(),
            planId: z.string(),
            startsAt: z.coerce.date(),
            expiresAt: z.coerce.date().nullable(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { planId } = request.body;

      try {
        const changeTenantPlanUseCase = makeChangeTenantPlanUseCase();
        const { tenantPlan } = await changeTenantPlanUseCase.execute({
          tenantId: id,
          planId,
        });

        return reply.status(200).send({ tenantPlan });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
