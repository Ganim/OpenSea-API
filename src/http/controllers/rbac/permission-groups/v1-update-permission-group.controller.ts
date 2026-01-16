import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import {
  permissionGroupSchema,
  updatePermissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeGetPermissionGroupByIdUseCase,
  makeUpdatePermissionGroupUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePermissionGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/rbac/permission-groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.UPDATE,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Update permission group',
      params: z.object({
        groupId: idSchema,
      }),
      body: updatePermissionGroupSchema,
      response: {
        200: z.object({
          group: permissionGroupSchema,
        }),
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
      const { name, description, color, priority, parentId, isActive } =
        request.body;
      const adminId = request.user.sub;

      try {
        // Busca dados anteriores e nome do admin para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { group: oldGroup }] = await Promise.all([
          getUserByIdUseCase.execute({ userId: adminId }),
          getPermissionGroupByIdUseCase.execute({ id: groupId }),
        ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const updatePermissionGroupUseCase = makeUpdatePermissionGroupUseCase();
        const { group } = await updatePermissionGroupUseCase.execute({
          groupId,
          name,
          description,
          color,
          priority,
          parentId,
          isActive,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.PERMISSION_GROUP_UPDATE,
          entityId: group.id.toString(),
          placeholders: { adminName, groupName: group.name },
          oldData: { name: oldGroup.name, description: oldGroup.description },
          newData: { name, description, color, priority, parentId, isActive },
        });

        return reply
          .status(200)
          .send({ group: PermissionGroupPresenter.toHTTP(group) });
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
