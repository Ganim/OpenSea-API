import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteInspectionPlanUseCase } from '@/use-cases/production/inspection-plans/factories/make-delete-inspection-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteInspectionPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/inspection-plans/:inspectionPlanId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ADMIN,
        resource: 'inspection-plans',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Delete an inspection plan',
      params: z.object({
        inspectionPlanId: z.string(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { inspectionPlanId } = request.params;

      const deleteInspectionPlanUseCase = makeDeleteInspectionPlanUseCase();
      await deleteInspectionPlanUseCase.execute({ inspectionPlanId });

      return reply.status(204).send();
    },
  });
}
