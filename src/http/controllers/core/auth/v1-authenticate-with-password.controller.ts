import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { authResponseSchema, loginSchema } from '@/http/schemas';
import { makeAuthenticateWithPasswordUseCase } from '@/use-cases/core/auth/factories/make-authenticate-with-password-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function authenticateWithPasswordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/login/password',
    schema: {
      tags: ['Auth'],
      summary: 'Authenticate user with email and password',
      body: loginSchema,
      response: {
        200: authResponseSchema,
        400: z.object({ message: z.string() }),
        403: z.union([
          z.object({ message: z.string(), blockedUntil: z.coerce.date() }),
          z.object({
            message: z.string(),
            code: z.literal('PASSWORD_RESET_REQUIRED'),
            resetToken: z.string(),
            reason: z.string().nullable().optional(),
            requestedAt: z.coerce.date().nullable().optional(),
          }),
        ]),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { email, password } = request.body;

      const ip = request.ip;

      try {
        const authenticateUseCase = makeAuthenticateWithPasswordUseCase();

        const { user, sessionId, token, refreshToken } =
          await authenticateUseCase.execute({
            email,
            password,
            ip,
            reply,
          });

        return reply
          .setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: true,
            sameSite: true,
            httpOnly: true,
          })
          .status(200)
          .send({ user, sessionId, token, refreshToken });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof PasswordResetRequiredError) {
          return reply.status(403).send({
            message: error.message,
            code: error.code,
            resetToken: error.data.resetToken,
            reason: error.data.reason ?? null,
            requestedAt: error.data.requestedAt ?? null,
          });
        }
        if (error instanceof UserBlockedError) {
          return reply.status(403).send({
            message: error.message,
            blockedUntil: error.blockedUntil,
          });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
