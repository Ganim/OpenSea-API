import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeRevealUserTotpUseCase } from '@/use-cases/core/users/factories/make-reveal-user-totp-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function revealUserTotpController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/users/:userId/totp/reveal',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.USERS.SECURITY.REVEAL_ADMIN_TOKEN,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Admin reveals rotating admin-reset TOTP code for a user',
      description:
        'Returns the current 6-char rotating code derived from the user\'s stable totpSecret. Code rotates every 60s. Intended to be relayed verbally (phone, in-person) so the user can redefine their password via the "esqueci minha senha" flow without email.',
      params: z.object({ userId: z.uuid() }),
      response: {
        200: z.object({
          code: z.string(),
          expiresAt: z.iso.datetime(),
          periodSeconds: z.number().int().positive(),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const requestedByUserId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: admin } = await getUserByIdUseCase.execute({
          userId: requestedByUserId,
        });
        const { user: target } = await getUserByIdUseCase.execute({
          userId,
        });

        const revealUseCase = makeRevealUserTotpUseCase();
        const { code, expiresAt, periodSeconds } = await revealUseCase.execute({
          targetUserId: userId,
          requestedByUserId,
        });

        const adminName = admin.profile?.name
          ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
          : admin.username || admin.email;
        const userName = target.profile?.name
          ? `${target.profile.name} ${target.profile.surname || ''}`.trim()
          : target.username || target.email;

        // Nunca loga o código — apenas o evento de revelação.
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_TOTP_REVEALED_BY_ADMIN,
          entityId: userId,
          placeholders: { adminName, userName },
          affectedUserId: userId,
        });

        return reply.status(200).send({
          code,
          expiresAt: expiresAt.toISOString(),
          periodSeconds,
        });
      } catch (error) {
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
