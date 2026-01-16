import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeChangeUserUsernameUseCase } from '@/use-cases/core/users/factories/make-change-user-username-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeUserUsernameController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/users/:userId/username',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.MANAGE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Change user username',
      params: z.object({
        userId: z.uuid(),
      }),
      body: z.object({
        username: z.string().min(3).max(30),
      }),
      response: {
        200: z.object({
          user: z.object({
            id: z.string(),
            email: z.string(),
            username: z.string(),
            lastLoginAt: z.coerce.date().nullable(),
            deletedAt: z.coerce.date().nullable().optional(),
            profile: z
              .object({
                id: z.string(),
                userId: z.string(),
                name: z.string(),
                surname: z.string(),
                birthday: z.coerce.date().optional(),
                location: z.string(),
                bio: z.string(),
                avatarUrl: z.string(),
                createdAt: z.coerce.date(),
                updatedAt: z.coerce.date().optional(),
              })
              .nullable()
              .optional(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      required: ['id', 'username'],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { username } = request.body;
      const adminId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();

        // Busca dados anteriores e nome do admin para auditoria
        const [{ user: targetUser }, { user: admin }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getUserByIdUseCase.execute({ userId: adminId }),
        ]);
        const oldUsername = targetUser.username;
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const changeUserUsernameUseCase = makeChangeUserUsernameUseCase();
        const { user } = await changeUserUsernameUseCase.execute({
          userId,
          username,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_USERNAME_CHANGE,
          entityId: user.id.toString(),
          placeholders: {
            adminName,
            userName,
            oldUsername: oldUsername || '',
            newUsername: username,
          },
          oldData: { username: oldUsername },
          newData: { username },
          affectedUserId: userId,
        });

        return reply.status(200).send({ user });
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
