import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateInspectionPlanSchema,
  inspectionPlanResponseSchema,
} from '@/http/schemas/production';
import { inspectionPlanToDTO } from '@/mappers/production/inspection-plan-to-dto';
import { makeUpdateInspectionPlanUseCase } from '@/use-cases/production/inspection-plans/factories/make-update-inspection-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateInspectionPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/production/inspection-plans/:inspectionPlanId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.MODIFY,
        resource: 'inspection-plans',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Update an inspection plan',
      params: z.object({
        inspectionPlanId: z.string(),
      }),
      body: updateInspectionPlanSchema,
      response: {
        200: z.object({
          inspectionPlan: inspectionPlanResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { inspectionPlanId } = request.params;
      const body = request.body;

      const updateInspectionPlanUseCase = makeUpdateInspectionPlanUseCase();
      const { inspectionPlan } = await updateInspectionPlanUseCase.execute({
        inspectionPlanId,
        ...body,
      });

      return reply.status(200).send({
        inspectionPlan: inspectionPlanToDTO(inspectionPlan),
      });
    },
  });
}
