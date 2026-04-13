import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createDefectTypeSchema,
  defectTypeResponseSchema,
} from '@/http/schemas/production';
import { defectTypeToDTO } from '@/mappers/production/defect-type-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateDefectTypeUseCase } from '@/use-cases/production/defect-types/factories/make-create-defect-type-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createDefectTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/defect-types',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.QUALITY.REGISTER,
        resource: 'defect-types',
      }),
    ],
    schema: {
      tags: ['Production - Quality'],
      summary: 'Create a new defect type',
      body: createDefectTypeSchema,
      response: {
        201: z.object({
          defectType: defectTypeResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { code, name, description, severity, isActive } = request.body;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createDefectTypeUseCase = makeCreateDefectTypeUseCase();
      const { defectType } = await createDefectTypeUseCase.execute({
        tenantId,
        code,
        name,
        description,
        severity,
        isActive,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DEFECT_TYPE_CREATE,
        entityId: defectType.id.toString(),
        placeholders: { userName, name: defectType.name },
        newData: { code, name, description, severity, isActive },
      });

      return reply
        .status(201)
        .send({ defectType: defectTypeToDTO(defectType) });
    },
  });
}
