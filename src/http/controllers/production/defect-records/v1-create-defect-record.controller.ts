import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDefectRecordSchema,
  defectRecordResponseSchema,
} from '@/http/schemas/production';
import { defectRecordToDTO } from '@/mappers/production/defect-record-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDefectRecordUseCase } from '@/use-cases/production/defect-records/factories/make-create-defect-record-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDefectRecordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/defect-records',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.REGISTER,
        resource: 'defect-records',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Create a defect record',
      body: createDefectRecordSchema,
      response: {
        201: z.object({
          defectRecord: defectRecordResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const {
        inspectionResultId,
        defectTypeId,
        operatorId,
        quantity,
        severity,
        description,
        imageUrl,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createDefectRecordUseCase = makeCreateDefectRecordUseCase();
      const { defectRecord } = await createDefectRecordUseCase.execute({
        inspectionResultId,
        defectTypeId,
        operatorId,
        quantity,
        severity,
        description,
        imageUrl,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DEFECT_RECORD_CREATE,
        entityId: defectRecord.defectRecordId.toString(),
        placeholders: { userName, defectTypeName: defectTypeId },
        newData: { defectTypeId, severity, quantity, description },
      });

      return reply
        .status(201)
        .send({ defectRecord: defectRecordToDTO(defectRecord) });
    },
  });
}
