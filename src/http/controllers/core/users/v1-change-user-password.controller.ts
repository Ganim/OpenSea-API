import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { strongPasswordSchema, userResponseSchema } from '@/http/schemas';
import { makeChangeUserPasswordUseCase } from '@/use-cases/core/users/factories/make-change-user-password-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function changeUserPasswordController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/users/:userId/password',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['Users'],
      summary: 'Change user password (Admin)',
      description:
        'Admin endpoint to change user password with strong password requirements',
      params: z.object({
        userId: z.uuid(),
      }),
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
      const { userId } = request.params;
      const { password } = request.body;

      try {
        const changeUserPasswordUseCase = makeChangeUserPasswordUseCase();

        const { user } = await changeUserPasswordUseCase.execute({
          userId,
          password,
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
