import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { assignGroupToUserSchema } from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeAssignGroupToUserUseCase,
  makeGetPermissionGroupByIdUseCase,
} from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function assignGroupToUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/users/:userId/groups',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_GROUPS.MANAGE,
        resource: 'user-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Assign permission group to user',
      params: z.object({
        userId: idSchema,
      }),
      body: assignGroupToUserSchema,
      response: {
        201: z.object({
          success: z.boolean(),
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
      const { userId } = request.params;
      const { groupId, expiresAt, grantedBy } = request.body;
      const adminId = request.user.sub;

      try {
        // Busca dados para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const [{ user: admin }, { user: targetUser }, { group }] =
          await Promise.all([
            getUserByIdUseCase.execute({ userId: adminId }),
            getUserByIdUseCase.execute({ userId }),
            getPermissionGroupByIdUseCase.execute({ id: groupId }),
          ]);
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;
        const userName = targetUser.profile?.name
          ? `${targetUser.profile.name} ${targetUser.profile.surname || ''}`.trim()
          : targetUser.username || targetUser.email;

        const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();
        await assignGroupToUserUseCase.execute({
          userId,
          groupId,
          expiresAt: expiresAt ?? null,
          grantedBy: grantedBy ?? null,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.GROUP_ASSIGN_TO_USER,
          entityId: `${userId}-${groupId}`,
          placeholders: { adminName, groupName: group.name, userName },
          newData: { userId, groupId, expiresAt },
          affectedUserId: userId,
        });

        return reply.status(201).send({ success: true });
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
