import { env } from '@/@env';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { getRateLimitConfig } from '@/config/rate-limits';
import { Token } from '@/entities/core/value-objects/token';
import { makeRefreshSessionUseCase } from '@/use-cases/core/sessions/factories/make-refresh-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function refreshSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sessions/refresh',
    config: {
      rateLimit: getRateLimitConfig('auth'),
    },
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'Refresh the current authenticated user session',
      description:
        'Renova a sessao do usuario utilizando o refresh token. Retorna novos tokens de acesso e refresh.',
      headers: z.object({
        authorization: z.string().describe('Bearer <refresh_token>').optional(),
      }),
      response: {
        200: z.object({
          token: z.string(),
          refreshToken: z.string(),
        }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      // Extract refresh token from Authorization header
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          message: 'Refresh token is required in Authorization header.',
        });
      }

      const refreshTokenValue = authHeader.substring(7); // Remove 'Bearer '

      if (!refreshTokenValue || !Token.isValid(refreshTokenValue)) {
        return reply
          .status(401)
          .send({ message: 'Invalid refresh token format.' });
      }

      const ip = request.ip;

      try {
        const refreshSessionUseCase = makeRefreshSessionUseCase();

        // Não usamos mais 'permissions' do use case - elas são verificadas via middleware
        // Isso reduz significativamente o tamanho do JWT (de ~4KB para ~500 bytes)
        const { session, refreshToken } = await refreshSessionUseCase.execute({
          refreshToken: refreshTokenValue,
          ip,
          reply,
        });

        // Generate new access token (sem permissões - são verificadas via banco)
        const newAccessToken = await reply.jwtSign(
          {
            sessionId: session.id,
          },
          {
            sign: {
              sub: session.userId,
              expiresIn: '30m',
            },
          },
        );

        return reply
          .setCookie('refreshToken', refreshToken.token, {
            path: '/',
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos (igual ao JWT refresh token)
          })
          .status(200)
          .send({
            token: newAccessToken,
            refreshToken: refreshToken.token,
          });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
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
