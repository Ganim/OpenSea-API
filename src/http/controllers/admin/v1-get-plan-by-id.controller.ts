import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetPlanByIdUseCase } from '@/use-cases/admin/plans/factories/make-get-plan-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPlanByIdAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/plans/:id',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'Get plan details (super admin)',
      description:
        'Returns detailed information about a specific plan including its associated modules. Requires super admin privileges.',
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
          modules: z.array(
            z.object({
              id: z.string(),
              planId: z.string(),
              module: z.string(),
            }),
          ),
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
        const getPlanByIdUseCase = makeGetPlanByIdUseCase();
        const { plan, modules } = await getPlanByIdUseCase.execute({
          planId: id,
        });

        return reply.status(200).send({ plan, modules });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
