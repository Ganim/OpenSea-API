import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitPlanResponseSchema,
  createBenefitPlanSchema,
} from '@/http/schemas/hr/benefits';
import { benefitPlanToDTO } from '@/mappers/hr/benefit-plan';
import { makeCreateBenefitPlanUseCase } from '@/use-cases/hr/benefit-plans/factories/make-create-benefit-plan-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateBenefitPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/benefit-plans',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.REGISTER,
        resource: 'benefit-plans',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Create benefit plan',
      description: 'Creates a new benefit plan',
      body: createBenefitPlanSchema,
      response: {
        201: z.object({ benefitPlan: benefitPlanResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateBenefitPlanUseCase();
        const { benefitPlan } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.BENEFIT_PLAN_CREATE,
          entityId: benefitPlan.id.toString(),
          placeholders: {
            userName: request.user.sub,
            planName: benefitPlan.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ benefitPlan: benefitPlanToDTO(benefitPlan) });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
