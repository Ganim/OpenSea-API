import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteBomItemUseCase } from '@/use-cases/production/bom-items/factories/make-delete-bom-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteBomItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/boms/:bomId/items/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'bom-items',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Remove an item from a bill of materials',
      params: z.object({
        bomId: z.string(),
        id: z.string(),
      }),
      response: {
        204: z.null().describe('BOM item deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const _tenantId = request.user.tenantId!;
      const { bomId, id } = request.params;
      const userId = request.user.sub;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteBomItemUseCase = makeDeleteBomItemUseCase();
      await deleteBomItemUseCase.execute({ id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_ITEM_DELETE,
        entityId: id,
        placeholders: { userName },
        oldData: { id, bomId },
      });

      return reply.status(204).send(null);
    },
  });
}
