import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createFavoriteBodySchema,
  favoriteResponseSchema,
} from '@/http/schemas/ai';
import { makeCreateFavoriteUseCase } from '@/use-cases/ai/favorites/factories/make-create-favorite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createFavoriteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/ai/favorites',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Favorites'],
      summary: 'Save a favorite AI query',
      security: [{ bearerAuth: [] }],
      body: createFavoriteBodySchema,
      response: {
        201: z.object({ favorite: favoriteResponseSchema }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeCreateFavoriteUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.body,
      });

      return reply.status(201).send(result);
    },
  });
}
