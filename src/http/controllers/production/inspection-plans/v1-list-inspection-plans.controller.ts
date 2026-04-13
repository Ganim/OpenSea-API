import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { inspectionPlanResponseSchema } from '@/http/schemas/production';
import { inspectionPlanToDTO } from '@/mappers/production/inspection-plan-to-dto';
import { makeListInspectionPlansUseCase } from '@/use-cases/production/inspection-plans/factories/make-list-inspection-plans-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listInspectionPlansController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/inspection-plans',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.ACCESS,
        resource: 'inspection-plans',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'List inspection plans',
      querystring: z.object({
        operationRoutingId: z.string(),
      }),
      response: {
        200: z.object({
          inspectionPlans: z.array(inspectionPlanResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { operationRoutingId } = request.query;

      const listInspectionPlansUseCase = makeListInspectionPlansUseCase();
      const { inspectionPlans } = await listInspectionPlansUseCase.execute({
        operationRoutingId,
      });

      return reply.status(200).send({
        inspectionPlans: inspectionPlans.map(inspectionPlanToDTO),
      });
    },
  });
}
