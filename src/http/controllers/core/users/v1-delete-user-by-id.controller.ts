import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteUserByIdUseCase } from '@/use-cases/core/users/factories/make-delete-user-by-id-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function DeleteUserByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/users/:userId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.DELETE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Delete a user',
      params: z.object({
        userId: z.uuid(),
      }),
      response: {
        200: z.void(),
        404: z.object({
          message: z.string(),
        }),
      },
      required: ['userId'],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const adminId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();

        // Busca dados antes da exclusão para auditoria
        const [{ user: targetUser }, { user: admin }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getUserByIdUseCase.execute({ userId: adminId }),
        ]);

        const userName = targetUser.profile?.name
          ? `${targetUser.profile.name} ${targetUser.profile.surname || ''}`.trim()
          : targetUser.username || targetUser.email;
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const deleteUserByIdUseCase = makeDeleteUserByIdUseCase();
        await deleteUserByIdUseCase.execute({ userId });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_DELETE,
          entityId: userId,
          placeholders: { adminName, userName },
          oldData: {
            id: targetUser.id,
            email: targetUser.email,
            username: targetUser.username,
          },
          affectedUserId: userId,
        });

        return reply.status(200).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
