import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { requestPasswordResetSchema } from '@/http/schemas';
import { makeSendPasswordResetTokenUseCase } from '@/use-cases/core/auth/factories/make-send-password-reset-token-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function sendPasswordResetTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/send/password',
    schema: {
      tags: ['Auth'],
      summary: 'Request password recovery by email',
      description: 'Send password reset token to user email address',
      body: requestPasswordResetSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { email } = request.body;
      try {
        const useCase = makeSendPasswordResetTokenUseCase();
        await useCase.execute({ email });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.AUTH_PASSWORD_RESET_REQUEST,
          entityId: email,
          placeholders: { email },
        });

        return reply
          .status(200)
          .send({ message: 'Token sent to the provided email.' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
