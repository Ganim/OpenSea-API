import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteDefectTypeUseCase } from '@/use-cases/production/defect-types/factories/make-delete-defect-type-use-case';
import { makeGetDefectTypeByIdUseCase } from '@/use-cases/production/defect-types/factories/make-get-defect-type-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteDefectTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
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
      summary: 'Delete a defect type',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Defect type deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const getDefectTypeByIdUseCase = makeGetDefectTypeByIdUseCase();

      const [{ user }, { defectType }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getDefectTypeByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteDefectTypeUseCase = makeDeleteDefectTypeUseCase();
      await deleteDefectTypeUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.DEFECT_TYPE_DELETE,
        entityId: id,
        placeholders: { userName, name: defectType.name },
        oldData: { id: defectType.id.toString(), name: defectType.name },
      });

      return reply.status(204).send(null);
    },
  });
}
