import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeGetPermissionGroupByIdUseCase,
  makeRemoveGroupFromUserUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeGroupFromUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/users/:userId/groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_GROUPS.MANAGE,
        resource: 'user-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Remove permission group from user',
      params: z.object({
        userId: idSchema,
        groupId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { userId, groupId } = request.params;
      const adminId = request.user.sub;
      const tenantId = request.user.tenantId;

      try {
        // Busca dados para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { user: targetUser }, { group }] =
          await Promise.all([
            getUserByIdUseCase.execute({ userId: adminId }),
            getUserByIdUseCase.execute({ userId }),
            getPermissionGroupByIdUseCase.execute({ id: groupId, tenantId }),
          ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;
        const userName = targetUser.profile?.name
          ? `${targetUser.profile.name} ${targetUser.profile.surname || ''}`.trim()
          : targetUser.username || targetUser.email;

        const removeGroupFromUserUseCase = makeRemoveGroupFromUserUseCase();
        await removeGroupFromUserUseCase.execute({
          userId,
          groupId,
          tenantId,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.GROUP_REMOVE_FROM_USER,
          entityId: `${userId}-${groupId}`,
          placeholders: { adminName, groupName: group.name, userName },
          oldData: { userId, groupId },
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
