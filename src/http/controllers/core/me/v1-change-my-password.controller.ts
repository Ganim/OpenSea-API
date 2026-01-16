import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { strongPasswordSchema, userResponseSchema } from '@/http/schemas';
import { makeChangeMyPasswordUseCase } from '@/use-cases/core/me/factories/make-change-my-password-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeMyPasswordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/me/password',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Change self password by authenticated user',
      description:
        'Change own password with strong password requirements (8+ chars, uppercase, lowercase, number, special character)',
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
      const userId = request.user.sub;

      const { password } = request.body;

      try {
        const changeMyPasswordUseCase = makeChangeMyPasswordUseCase();

        const { user } = await changeMyPasswordUseCase.execute({
          userId,
          password,
        });

        // Log de auditoria
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.ME_PASSWORD_CHANGE,
          entityId: user.id.toString(),
          placeholders: { userName },
          newData: { password }, // Será sanitizado para [REDACTED]
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
