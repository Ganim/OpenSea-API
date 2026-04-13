import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createInspectionResultSchema,
  inspectionResultResponseSchema,
} from '@/http/schemas/production';
import { inspectionResultToDTO } from '@/mappers/production/inspection-result-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateInspectionResultUseCase } from '@/use-cases/production/inspection-results/factories/make-create-inspection-result-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createInspectionResultController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/inspection-results',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.REGISTER,
        resource: 'inspection-results',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Create an inspection result',
      body: createInspectionResultSchema,
      response: {
        201: z.object({
          inspectionResult: inspectionResultResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const {
        inspectionPlanId,
        productionOrderId,
        sampleSize,
        defectsFound,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createInspectionResultUseCase = makeCreateInspectionResultUseCase();
      const { inspectionResult } = await createInspectionResultUseCase.execute({
        inspectionPlanId,
        productionOrderId,
        inspectedById: userId,
        sampleSize,
        defectsFound,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.INSPECTION_RESULT_CREATE,
        entityId: inspectionResult.inspectionResultId.toString(),
        placeholders: { userName, orderNumber: productionOrderId },
        newData: {
          inspectionPlanId,
          productionOrderId,
          sampleSize,
          defectsFound,
          notes,
        },
      });

      return reply
        .status(201)
        .send({ inspectionResult: inspectionResultToDTO(inspectionResult) });
    },
  });
}
