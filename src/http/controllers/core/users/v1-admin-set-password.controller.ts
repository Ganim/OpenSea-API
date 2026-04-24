import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { userResponseSchema } from '@/http/schemas';
import { makeAdminSetPasswordUseCase } from '@/use-cases/core/users/factories/make-admin-set-password-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function adminSetPasswordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users/:userId/set-password',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.USERS.SECURITY.SET_PASSWORD,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Admin sets a new password for a user',
      description:
        'Admin endpoint to set a new password directly for a user. The user is not required to confirm. All active sessions for the target user are revoked. Optionally forces the user to change the password on their next login.',
      params: z.object({
        userId: z.uuid(),
      }),
      body: z.object({
        newPassword: z
          .string()
          .min(8)
          .describe('New password (plain-text, will be hashed server-side)'),
        forceChangeOnNextLogin: z
          .boolean()
          .default(true)
          .describe(
            'Whether to force the user to change the password on next login',
          ),
      }),
      response: {
        200: z.object({
          user: userResponseSchema,
          revokedSessionsCount: z.number().int().nonnegative(),
        }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { newPassword, forceChangeOnNextLogin } = request.body;
      const requestedByUserId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: requestedByUserId,
        });
        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;

        const adminSetPasswordUseCase = makeAdminSetPasswordUseCase();
        const { user, revokedSessionsCount } =
          await adminSetPasswordUseCase.execute({
            targetUserId: userId,
            requestedByUserId,
            newPassword,
            forceChangeOnNextLogin,
          });

        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_PASSWORD_SET_BY_ADMIN,
          entityId: user.id.toString(),
          placeholders: {
            adminName,
            userName,
            forceChange: forceChangeOnNextLogin ? 'sim' : 'não',
          },
          newData: { forceChangeOnNextLogin, revokedSessionsCount },
          affectedUserId: userId,
        });

        return reply.status(200).send({ user, revokedSessionsCount });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
