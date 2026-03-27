import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeUnlinkAuthMethodUseCase } from '@/use-cases/core/auth/factories/make-unlink-auth-method-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const paramsSchema = z.object({
  id: z.uuid(),
});

export async function unlinkMyAuthMethodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/me/auth-links/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Auth - Me'],
      summary: 'Unlink an authentication method from my account',
      security: [{ bearerAuth: [] }],
      params: paramsSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        const useCase = makeUnlinkAuthMethodUseCase();
        await useCase.execute({
          authLinkId: new UniqueEntityID(id),
          userId: new UniqueEntityID(userId),
        });

        return reply
          .status(200)
          .send({ message: 'Método de autenticação removido com sucesso.' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
