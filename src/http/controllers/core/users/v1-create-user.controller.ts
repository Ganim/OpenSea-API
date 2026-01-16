import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  createUserSchema,
  userProfileSchema,
  userResponseSchema,
} from '@/http/schemas';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createUserBodySchema = createUserSchema.extend({
  profile: userProfileSchema.optional(),
});

export async function createUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.CREATE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Create a new user',
      description:
        'Create user with strong password requirements (8+ chars, uppercase, lowercase, number, special character)',
      body: createUserBodySchema,
      response: {
        201: z.object({
          user: userResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { email, password, username, profile } = request.body;
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

        const createUserUseCase = makeCreateUserUseCase();
        const { user } = await createUserUseCase.execute({
          email,
          password,
          username,
          profile,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.USER_CREATE,
          entityId: user.id.toString(),
          placeholders: { adminName, userName },
          newData: { email, username, profile },
          affectedUserId: user.id.toString(),
        });

        return reply.status(201).send({ user });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
