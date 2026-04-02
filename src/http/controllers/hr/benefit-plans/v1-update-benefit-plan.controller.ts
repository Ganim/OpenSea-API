import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitPlanResponseSchema,
  updateBenefitPlanSchema,
} from '@/http/schemas/hr/benefits';
import { cuidSchema } from '@/http/schemas/common.schema';
import { benefitPlanToDTO } from '@/mappers/hr/benefit-plan';
import { makeUpdateBenefitPlanUseCase } from '@/use-cases/hr/benefit-plans/factories/make-update-benefit-plan-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateBenefitPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/benefit-plans/:benefitPlanId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.MODIFY,
        resource: 'benefit-plans',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Update benefit plan',
      description: 'Updates an existing benefit plan',
      params: z.object({ benefitPlanId: cuidSchema }),
      body: updateBenefitPlanSchema,
      response: {
        200: z.object({ benefitPlan: benefitPlanResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { benefitPlanId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateBenefitPlanUseCase();
        const { benefitPlan } = await useCase.execute({
          tenantId,
          benefitPlanId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_PLAN_UPDATE,
          entityId: benefitPlan.id.toString(),
          placeholders: {
            userName: request.user.sub,
            planName: benefitPlan.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ benefitPlan: benefitPlanToDTO(benefitPlan) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
