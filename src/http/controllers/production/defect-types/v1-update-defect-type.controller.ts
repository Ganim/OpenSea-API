import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateDefectTypeSchema,
  defectTypeResponseSchema,
} from '@/http/schemas/production';
import { defectTypeToDTO } from '@/mappers/production/defect-type-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetDefectTypeByIdUseCase } from '@/use-cases/production/defect-types/factories/make-get-defect-type-by-id-use-case';
import { makeUpdateDefectTypeUseCase } from '@/use-cases/production/defect-types/factories/make-update-defect-type-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDefectTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/defect-types/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.MODIFY,
        resource: 'defect-types',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Update a defect type',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateDefectTypeSchema,
      response: {
        200: z.object({
          defectType: defectTypeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { name, description, severity, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getDefectTypeByIdUseCase = makeGetDefectTypeByIdUseCase();

      const [{ user }, { defectType: oldDefectType }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getDefectTypeByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateDefectTypeUseCase = makeUpdateDefectTypeUseCase();
      const { defectType } = await updateDefectTypeUseCase.execute({
        tenantId,
        id,
        name,
        description,
        severity,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DEFECT_TYPE_UPDATE,
        entityId: defectType.id.toString(),
        placeholders: { userName, name: defectType.name },
        oldData: { name: oldDefectType.name },
        newData: { name, description, severity, isActive },
      });

      return reply
        .status(200)
        .send({ defectType: defectTypeToDTO(defectType) });
    },
  });
}
