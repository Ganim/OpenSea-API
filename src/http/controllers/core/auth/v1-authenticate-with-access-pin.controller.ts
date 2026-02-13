import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { PinSetupRequiredError } from '@/@errors/use-cases/pin-setup-required-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UserBlockedError } from '@/@errors/use-cases/user-blocked-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { authResponseSchema, authenticateWithPinBodySchema } from '@/http/schemas';
import { makeAuthenticateWithAccessPinUseCase } from '@/use-cases/core/auth/factories/make-authenticate-with-access-pin-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function authenticateWithAccessPinController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/login/pin',
    schema: {
      tags: ['Auth'],
      summary: 'Authenticate user with access PIN (fast login)',
      body: authenticateWithPinBodySchema,
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
          z.object({
            message: z.string(),
            code: z.literal('PIN_SETUP_REQUIRED'),
            pinType: z.string(),
          }),
        ]),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { userId, accessPin } = request.body;

      const ip = request.ip;
      const userAgent = request.headers['user-agent'];

      try {
        const authenticateUseCase = makeAuthenticateWithAccessPinUseCase();

        const { user, sessionId, token, refreshToken } =
          await authenticateUseCase.execute({
            userId,
            accessPin,
            ip,
            userAgent,
            reply,
          });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.AUTH_LOGIN,
          entityId: sessionId,
          placeholders: {
            userName: user.profile?.name
              ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
              : user.username || user.email,
          },
          affectedUserId: user.id,
          newData: { email: user.email, sessionId, method: 'access_pin' },
        });

        return reply
          .setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60,
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
        if (error instanceof PinSetupRequiredError) {
          return reply.status(403).send({
            message: error.message,
            code: error.code,
            pinType: error.data.pinType,
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
