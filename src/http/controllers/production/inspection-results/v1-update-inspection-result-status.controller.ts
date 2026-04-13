import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateInspectionResultStatusSchema,
  inspectionResultResponseSchema,
} from '@/http/schemas/production';
import { inspectionResultToDTO } from '@/mappers/production/inspection-result-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateInspectionResultUseCase } from '@/use-cases/production/inspection-results/factories/make-update-inspection-result-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateInspectionResultStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/production/inspection-results/:inspectionResultId/status',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.MODIFY,
        resource: 'inspection-results',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Update inspection result status',
      params: z.object({
        inspectionResultId: z.string(),
      }),
      body: updateInspectionResultStatusSchema,
      response: {
        200: z.object({
          inspectionResult: inspectionResultResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { inspectionResultId } = request.params;
      const { status, defectsFound, notes } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateInspectionResultUseCase = makeUpdateInspectionResultUseCase();
      const { inspectionResult } = await updateInspectionResultUseCase.execute({
        inspectionResultId,
        status,
        defectsFound,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.INSPECTION_RESULT_UPDATE,
        entityId: inspectionResultId,
        placeholders: { userName, status: status ?? inspectionResult.status },
        newData: { status, defectsFound, notes },
      });

      return reply
        .status(200)
        .send({ inspectionResult: inspectionResultToDTO(inspectionResult) });
    },
  });
}
