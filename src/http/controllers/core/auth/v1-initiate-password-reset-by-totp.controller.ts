import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { makeInitiatePasswordResetByTotpUseCase } from '@/use-cases/core/auth/factories/make-initiate-password-reset-by-totp-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function initiatePasswordResetByTotpController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/password-reset/initiate-by-totp',
    schema: {
      tags: ['Auth'],
      summary: 'Initiate password reset with an admin-provided TOTP code',
      description:
        'Alternative to the email-based password reset. The user enters a rotating 6-char code provided by an admin (via phone or in-person) to obtain a resetToken. The resetToken is then used with POST /v1/auth/reset-password-by-token to finalize the reset.',
      body: z.object({
        email: z.email(),
        totpCode: z
          .string()
          .min(4)
          .max(16)
          .describe('Rotating 6-char code, alphanumeric, case-insensitive'),
      }),
      response: {
        200: z.object({
          resetToken: z.string(),
          expiresAt: z.iso.datetime(),
        }),
        401: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { email, totpCode } = request.body;

      try {
        const useCase = makeInitiatePasswordResetByTotpUseCase();
        const { resetToken, expiresAt } = await useCase.execute({
          email,
          totpCode,
        });

        return reply.status(200).send({
          resetToken,
          expiresAt: expiresAt.toISOString(),
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
