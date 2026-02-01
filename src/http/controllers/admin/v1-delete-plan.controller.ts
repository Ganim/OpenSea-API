import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeDeletePlanUseCase } from '@/use-cases/admin/plans/factories/make-delete-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePlanAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/plans/:id',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'Deactivate a plan (super admin)',
      description:
        'Deactivates an existing subscription plan by setting its active status to false. The plan is not permanently deleted. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          plan: z.object({
            id: z.string(),
            name: z.string(),
            tier: z.string(),
            description: z.string().nullable(),
            price: z.number(),
            isActive: z.boolean(),
            maxUsers: z.number(),
            maxWarehouses: z.number(),
            maxProducts: z.number(),
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

      try {
        const deletePlanUseCase = makeDeletePlanUseCase();
        const { plan } = await deletePlanUseCase.execute({ planId: id });

        return reply.status(200).send({ plan });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
