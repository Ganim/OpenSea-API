import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteWorkstationUseCase } from '@/use-cases/production/workstations/factories/make-delete-workstation-use-case';
import { makeGetWorkstationByIdUseCase } from '@/use-cases/production/workstations/factories/make-get-workstation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteWorkstationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/workstations/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'workstations',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Delete a workstation',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Workstation deleted successfully'),
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
      const getWorkstationByIdUseCase = makeGetWorkstationByIdUseCase();

      const [{ user }, { workstation }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getWorkstationByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteWorkstationUseCase = makeDeleteWorkstationUseCase();
      await deleteWorkstationUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_DELETE,
        entityId: id,
        placeholders: { userName, name: workstation.name },
        oldData: { id: workstation.id.toString(), name: workstation.name },
      });

      return reply.status(204).send(null);
    },
  });
}
