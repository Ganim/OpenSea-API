import z from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  registerSchema,
  userProfileSchema,
  userResponseSchema,
} from '@/http/schemas';
import { makeRegisterNewUserUseCase } from '@/use-cases/core/auth/factories/make-register-new-user-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function registerNewUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/register/password',
    schema: {
      tags: ['Auth'],
      summary: 'Register a new user',
      body: registerSchema.extend({
        username: z.string().min(3).max(30).optional(),
        profile: userProfileSchema.optional(),
      }),
      response: {
        201: z.object({
          user: userResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { email, password, username, profile } = request.body;

      try {
        const registerNewUserUseCase = makeRegisterNewUserUseCase();
        const { user } = await registerNewUserUseCase.execute({
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
