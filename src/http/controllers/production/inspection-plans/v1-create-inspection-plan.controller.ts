import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createInspectionPlanSchema,
  inspectionPlanResponseSchema,
} from '@/http/schemas/production';
import { inspectionPlanToDTO } from '@/mappers/production/inspection-plan-to-dto';
import { makeCreateInspectionPlanUseCase } from '@/use-cases/production/inspection-plans/factories/make-create-inspection-plan-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createInspectionPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/inspection-plans',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.REGISTER,
        resource: 'inspection-plans',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Create a new inspection plan',
      body: createInspectionPlanSchema,
      response: {
        201: z.object({
          inspectionPlan: inspectionPlanResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const body = request.body;

      const createInspectionPlanUseCase = makeCreateInspectionPlanUseCase();
      const { inspectionPlan } =
        await createInspectionPlanUseCase.execute(body);

      return reply.status(201).send({
        inspectionPlan: inspectionPlanToDTO(inspectionPlan),
      });
    },
  });
}
