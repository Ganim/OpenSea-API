import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { strongPasswordSchema, userResponseSchema } from '@/http/schemas';
import { makeChangeUserPasswordUseCase } from '@/use-cases/core/users/factories/make-change-user-password-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeUserPasswordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/users/:userId/password',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.MANAGE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Change user password (Admin)',
      description:
        'Admin endpoint to change user password with strong password requirements',
      params: z.object({
        userId: z.uuid(),
      }),
      body: z.object({
        password: strongPasswordSchema,
      }),
      response: {
        200: z.object({
          user: userResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { password } = request.body;
      const adminId = request.user.sub;

      try {
        // Busca nome do admin para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: adminId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const changeUserPasswordUseCase = makeChangeUserPasswordUseCase();
        const { user } = await changeUserPasswordUseCase.execute({
          userId,
          password,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_PASSWORD_CHANGE,
          entityId: user.id.toString(),
          placeholders: { adminName, userName },
          newData: { password }, // Será sanitizado para [REDACTED]
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
