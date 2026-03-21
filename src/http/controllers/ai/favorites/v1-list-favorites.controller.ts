import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listFavoritesQuerySchema, favoriteResponseSchema } from '@/http/schemas/ai';
import { makeListFavoritesUseCase } from '@/use-cases/ai/favorites/factories/make-list-favorites-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listFavoritesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/ai/favorites',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Favorites'],
      summary: 'List saved AI queries',
      security: [{ bearerAuth: [] }],
      querystring: listFavoritesQuerySchema,
      response: {
        200: z.object({
          favorites: z.array(favoriteResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeListFavoritesUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        ...request.query,
      });

      return reply.status(200).send(result);
    },
  });
}
