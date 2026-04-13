import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteWorkstationTypeUseCase } from '@/use-cases/production/workstation-types/factories/make-delete-workstation-type-use-case';
import { makeGetWorkstationTypeByIdUseCase } from '@/use-cases/production/workstation-types/factories/make-get-workstation-type-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteWorkstationTypeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/workstation-types/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'workstation-types',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Delete a workstation type',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Workstation type deleted successfully'),
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
      const getWorkstationTypeByIdUseCase = makeGetWorkstationTypeByIdUseCase();

      const [{ user }, { workstationType }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getWorkstationTypeByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteWorkstationTypeUseCase = makeDeleteWorkstationTypeUseCase();
      await deleteWorkstationTypeUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.WORKSTATION_TYPE_DELETE,
        entityId: id,
        placeholders: { userName, name: workstationType.name },
        oldData: {
          id: workstationType.id.toString(),
          name: workstationType.name,
        },
      });

      return reply.status(204).send(null);
    },
  });
}
