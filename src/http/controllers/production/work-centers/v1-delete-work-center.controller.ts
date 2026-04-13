import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteWorkCenterUseCase } from '@/use-cases/production/work-centers/factories/make-delete-work-center-use-case';
import { makeGetWorkCenterByIdUseCase } from '@/use-cases/production/work-centers/factories/make-get-work-center-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteWorkCenterController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/work-centers/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'work-centers',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Delete a work center',
      params: z.object({
        id: z.string(),
      }),
      response: {
        204: z.null().describe('Work center deleted successfully'),
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
      const getWorkCenterByIdUseCase = makeGetWorkCenterByIdUseCase();

      const [{ user }, { workCenter }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getWorkCenterByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteWorkCenterUseCase = makeDeleteWorkCenterUseCase();
      await deleteWorkCenterUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORK_CENTER_DELETE,
        entityId: id,
        placeholders: { userName, name: workCenter.name },
        oldData: { id: workCenter.id.toString(), name: workCenter.name },
      });

      return reply.status(204).send(null);
    },
  });
}
