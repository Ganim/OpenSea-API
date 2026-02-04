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
  makeRemovePermissionFromGroupUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removePermissionFromGroupController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/permission-groups/:groupId/permissions/:permissionId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.MANAGE,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Remove permission from group',
      params: z.object({
        groupId: idSchema,
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
      const { groupId, permissionId } = request.params;
      const adminId = request.user.sub;
      const tenantId = request.user.tenantId;

      try {
        // Busca dados para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { group }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getPermissionGroupByIdUseCase.execute({ id: groupId, tenantId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const removePermissionFromGroupUseCase =
          makeRemovePermissionFromGroupUseCase();

        await removePermissionFromGroupUseCase.execute({
          groupId,
          permissionId,
          tenantId,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.PERMISSION_REMOVE_FROM_GROUP,
          entityId: `${groupId}-${permissionId}`,
          placeholders: {
            adminName,
            permissionCode: permissionId,
            groupName: group.name,
          },
          oldData: { groupId, permissionId },
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
