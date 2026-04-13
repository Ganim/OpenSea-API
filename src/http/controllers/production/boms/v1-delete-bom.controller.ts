import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteBomUseCase } from '@/use-cases/production/boms/factories/make-delete-bom-use-case';
import { makeGetBomByIdUseCase } from '@/use-cases/production/boms/factories/make-get-bom-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteBomController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/boms/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.REMOVE,
        resource: 'boms',
      }),
    ],
    schema: {
      tags: ['Production - Engineering'],
      summary: 'Delete a bill of materials',
      params: z.object({
        id: z.string(),
      }),
      response: {
        204: z.null().describe('BOM deleted successfully'),
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
      const getBomByIdUseCase = makeGetBomByIdUseCase();

      const [{ user }, { bom }] = await Promise.all([
        getUserByIdUseCase.execute({ userId }),
        getBomByIdUseCase.execute({ tenantId, id }),
      ]);
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const deleteBomUseCase = makeDeleteBomUseCase();
      await deleteBomUseCase.execute({ tenantId, id });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.BOM_DELETE,
        entityId: id,
        placeholders: { userName, name: bom.name },
        oldData: { id: bom.id.toString(), name: bom.name },
      });

      return reply.status(204).send(null);
    },
  });
}
