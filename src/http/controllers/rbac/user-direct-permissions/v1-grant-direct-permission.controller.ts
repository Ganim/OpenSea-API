import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { grantDirectPermissionSchema } from '@/http/schemas/rbac.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGrantDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-grant-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function grantDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/users/:userId/direct-permissions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_PERMISSIONS.MANAGE,
        resource: 'user-permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Grant direct permission to user',
      params: z.object({
        userId: idSchema,
      }),
      body: grantDirectPermissionSchema,
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
      const { permissionId, effect, conditions, expiresAt, grantedBy } =
        request.body;
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

        const grantDirectPermissionUseCase = makeGrantDirectPermissionUseCase();
        await grantDirectPermissionUseCase.execute({
          userId,
          permissionId,
          effect,
          conditions,
          expiresAt: expiresAt ?? null,
          grantedBy: grantedBy ?? null,
        });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.RBAC.DIRECT_PERMISSION_GRANT,
          entityId: `${userId}-${permissionId}`,
          placeholders: { adminName, permissionCode: permissionId, userName },
          newData: { userId, permissionId, effect, conditions, expiresAt },
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
