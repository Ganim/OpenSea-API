import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeChangeMyUsernameUseCase } from '@/use-cases/core/me/factories/make-change-my-username-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeMyUsernameController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/me/username',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Change self username by authenticated user',
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
      required: ['username'],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const { username } = request.body;

      try {
        // Busca dados anteriores para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: oldUser } = await getUserByIdUseCase.execute({ userId });
        const oldUsername = oldUser.username;

        const changeMyUsernameUseCase = makeChangeMyUsernameUseCase();
        const { user } = await changeMyUsernameUseCase.execute({
          userId,
          username,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_USERNAME_CHANGE,
          entityId: user.id.toString(),
          placeholders: {
            userName,
            oldUsername: oldUsername || '',
            newUsername: username,
          },
          oldData: { username: oldUsername },
          newData: { username },
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
