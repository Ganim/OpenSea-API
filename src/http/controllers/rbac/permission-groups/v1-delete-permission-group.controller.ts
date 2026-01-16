import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { deletePermissionGroupQuerySchema } from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeDeletePermissionGroupUseCase,
  makeGetPermissionGroupByIdUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePermissionGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/permission-groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.DELETE,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Delete permission group (soft delete)',
      params: z.object({
        groupId: idSchema,
      }),
      querystring: deletePermissionGroupQuerySchema,
      response: {
        204: z.null(),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { groupId } = request.params;
      const { force } = request.query;
      const adminId = request.user.sub;

      try {
        // Busca dados antes da exclusão para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { group }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getPermissionGroupByIdUseCase.execute({ id: groupId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const deletePermissionGroupUseCase = makeDeletePermissionGroupUseCase();
        await deletePermissionGroupUseCase.execute({
          groupId,
          force,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.PERMISSION_GROUP_DELETE,
          entityId: groupId,
          placeholders: { adminName, groupName: group.name },
          oldData: { id: group.id, name: group.name },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
