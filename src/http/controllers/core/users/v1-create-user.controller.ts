import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    createUserSchema,
    userProfileSchema,
    userResponseSchema,
} from '@/http/schemas';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createUserBodySchema = createUserSchema.extend({
  profile: userProfileSchema.optional(),
});

export async function createUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/users',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.USERS.CREATE,
        resource: 'users',
      }),
    ],
    schema: {
      tags: ['Auth - Users'],
      summary: 'Create a new user',
      description:
        'Create user with strong password requirements (8+ chars, uppercase, lowercase, number, special character)',
      body: createUserBodySchema,
      response: {
        201: z.object({
          user: userResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { email, password, username, profile } = request.body;

      try {
        const createUserUseCase = makeCreateUserUseCase();
        const { user } = await createUserUseCase.execute({
          email,
          password,
          username,
          profile,
        });
        return reply.status(201).send({ user });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
