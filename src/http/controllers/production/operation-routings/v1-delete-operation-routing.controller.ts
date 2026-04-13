import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteOperationRoutingUseCase } from '@/use-cases/production/operation-routings/factories/make-delete-operation-routing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteOperationRoutingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/boms/:bomId/routings/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'operation-routings',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Delete an operation routing step',
      params: z.object({
        bomId: z.string().uuid(),
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Operation routing deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { bomId, id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteOperationRoutingUseCase =
        makeDeleteOperationRoutingUseCase();
      await deleteOperationRoutingUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.OPERATION_ROUTING_DELETE,
        entityId: id,
        placeholders: { userName, operationName: '' },
        oldData: { id, bomId },
      });

      return reply.status(204).send(null);
    },
  });
}
