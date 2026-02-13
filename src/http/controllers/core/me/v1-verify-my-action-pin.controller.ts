import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyActionPinBodySchema } from '@/http/schemas';
import { makeVerifyActionPinUseCase } from '@/use-cases/core/auth/factories/make-verify-action-pin-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function verifyMyActionPinController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/me/verify-action-pin',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Verify my action PIN for sensitive actions',
      body: verifyActionPinBodySchema,
      response: {
        200: z.object({ valid: z.boolean() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { actionPin } = request.body;

      try {
        const verifyActionPinUseCase = makeVerifyActionPinUseCase();

        const { valid } = await verifyActionPinUseCase.execute({
          userId,
          actionPin,
        });

        return reply.status(200).send({ valid });
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
