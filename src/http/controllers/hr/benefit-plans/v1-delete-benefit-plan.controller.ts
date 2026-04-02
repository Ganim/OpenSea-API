import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeDeleteBenefitPlanUseCase } from '@/use-cases/hr/benefit-plans/factories/make-delete-benefit-plan-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteBenefitPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/benefit-plans/:benefitPlanId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.REMOVE,
        resource: 'benefit-plans',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Delete benefit plan',
      description: 'Deactivates a benefit plan (soft delete)',
      params: z.object({ benefitPlanId: cuidSchema }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { benefitPlanId } = request.params;

      try {
        const useCase = makeDeleteBenefitPlanUseCase();
        const { benefitPlan } = await useCase.execute({
          tenantId,
          benefitPlanId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_PLAN_DELETE,
          entityId: benefitPlanId,
          placeholders: {
            userName: request.user.sub,
            planName: benefitPlan.name,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
