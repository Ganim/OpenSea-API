import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeRevokeDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-revoke-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function revokeDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/users/:userId/direct-permissions/:permissionId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_PERMISSIONS.MANAGE,
        resource: 'user-permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Revoke direct permission from user',
      params: z.object({
        userId: idSchema,
        permissionId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { userId, permissionId } = request.params;
      const adminId = request.user.sub;

      try {
        // Busca dados para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const [{ user: admin }, { user: targetUser }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getUserByIdUseCase.execute({ userId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;
        const userName = targetUser.profile?.name
          ? `${targetUser.profile.name} ${targetUser.profile.surname || ''}`.trim()
          : targetUser.username || targetUser.email;

        const revokeDirectPermissionUseCase =
          makeRevokeDirectPermissionUseCase();

        await revokeDirectPermissionUseCase.execute({
          userId,
          permissionId,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.DIRECT_PERMISSION_REVOKE,
          entityId: `${userId}-${permissionId}`,
          placeholders: { adminName, permissionCode: permissionId, userName },
          oldData: { userId, permissionId },
          affectedUserId: userId,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
