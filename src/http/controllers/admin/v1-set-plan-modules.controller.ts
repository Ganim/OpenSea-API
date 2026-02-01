import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeSetPlanModulesUseCase } from '@/use-cases/admin/plans/factories/make-set-plan-modules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function setPlanModulesAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/plans/:id/modules',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Plans'],
      summary: 'Set plan modules (super admin)',
      description:
        'Replaces the set of system modules associated with a plan. Modules determine which features are available to tenants subscribed to this plan. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        modules: z
          .array(
            z.enum([
              'CORE',
              'STOCK',
              'SALES',
              'HR',
              'PAYROLL',
              'REPORTS',
              'AUDIT',
              'REQUESTS',
              'NOTIFICATIONS',
            ]),
          )
          .min(1),
      }),
      response: {
        200: z.object({
          modules: z.array(
            z.object({
              id: z.string(),
              planId: z.string(),
              module: z.string(),
            }),
          ),
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
      const { id } = request.params;
      const { modules } = request.body;

      try {
        const setPlanModulesUseCase = makeSetPlanModulesUseCase();
        const { modules: updatedModules } = await setPlanModulesUseCase.execute(
          {
            planId: id,
            modules,
          },
        );

        return reply.status(200).send({ modules: updatedModules });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
