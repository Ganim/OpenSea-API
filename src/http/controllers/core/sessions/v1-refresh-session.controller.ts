import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeRefreshSessionUseCase } from '@/use-cases/core/sessions/factories/make-refresh-session-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function refreshSessionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sessions/refresh',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Sessions'],
      summary: 'Refresh the current authenticated user session',
      response: {
        200: z.object({
          token: z.string(),
          refreshToken: z.string(),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user?.sub;

      const { sessionId, permissions } = request.user;

      if (!sessionId) {
        return reply
          .status(400)
          .send({ message: 'Session ID is missing from token payload.' });
      }

      const ip = request.ip;

      try {
        const refreshSessionUseCase = makeRefreshSessionUseCase();

        const { refreshToken } = await refreshSessionUseCase.execute({
          sessionId,
          userId,
          ip,
          reply,
        });

        // Generate new access token
        const newAccessToken = await reply.jwtSign(
          {
            sessionId: sessionId,
            permissions: permissions,
          },
          {
            sign: {
              sub: userId,
              expiresIn: '30m',
            },
          },
        );

        return reply
          .setCookie('refreshToken', refreshToken.token, {
            path: '/',
            secure: true,
            sameSite: true,
            httpOnly: true,
          })
          .status(200)
          .send({
            token: newAccessToken,
            refreshToken: refreshToken.token,
          });
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
