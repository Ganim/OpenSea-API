import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeChangeMyProfileUseCase } from '@/use-cases/core/me/factories/make-change-my-profile-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeMyProfileController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/me',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Change self profile by authenticated user',
      description:
        'Atualiza os dados do perfil do usuario autenticado (nome, sobrenome, data de nascimento, localizacao, bio e avatar).',
      security: [{ bearerAuth: [] }],
      body: z.object({
        profile: z.object({
          name: z.string().optional(),
          surname: z.string().optional(),
          birthday: z.coerce.date().optional(),
          location: z.string().optional(),
          bio: z.string().optional(),
          avatarUrl: z.url().optional(),
        }),
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
      required: ['profile'],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      const { profile } = request.body;

      try {
        // Busca dados anteriores para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user: oldUser } = await getUserByIdUseCase.execute({ userId });
        const oldProfile = oldUser.profile;

        const changeMyProfileUseCase = makeChangeMyProfileUseCase();
        const { user } = await changeMyProfileUseCase.execute({
          userId,
          profile,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_PROFILE_CHANGE,
          entityId: user.id.toString(),
          placeholders: { userName },
          oldData: oldProfile as Record<string, unknown> | null,
          newData: profile as Record<string, unknown>,
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
