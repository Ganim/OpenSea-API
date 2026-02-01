import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteMyUserUseCase } from '@/use-cases/core/me/factories/make-delete-my-user-use-case';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteMyUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/me',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Delete authenticated user',
      description:
        'Realiza a exclusao (soft delete) da conta do usuario autenticado. Esta acao e irreversivel.',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.void(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;

      try {
        // Busca dados anteriores para auditoria
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });

        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteMyUserUseCase = makeDeleteMyUserUseCase();
        await deleteMyUserUseCase.execute({ userId });

        // Log de auditoria
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_ACCOUNT_DELETE,
          entityId: userId,
          placeholders: { userName },
          oldData: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
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
