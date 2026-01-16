import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { resetPasswordSchema } from '@/http/schemas';
import { makeResetPasswordByTokenUseCase } from '@/use-cases/core/auth/factories/make-reset-password-by-token-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function resetPasswordByTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/reset/password',
    schema: {
      tags: ['Auth'],
      summary: 'Reset password using recovery token',
      description:
        'Reset password with strong password requirements (8+ chars, uppercase, lowercase, number, special character)',
      body: resetPasswordSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { token, newPassword } = request.body;
      try {
        const useCase = makeResetPasswordByTokenUseCase();
        await useCase.execute({ token, password: newPassword });

        // Log de auditoria (sem contexto de usuário pois é operação anônima)
        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.AUTH_PASSWORD_RESET_COMPLETE,
          entityId: token.slice(0, 8),
          placeholders: {
            userName: 'Usuário',
          },
        });

        return reply
          .status(200)
          .send({ message: 'Password reset successfully.' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
