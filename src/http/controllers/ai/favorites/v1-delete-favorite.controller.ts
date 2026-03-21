import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { deleteFavoriteParamsSchema } from '@/http/schemas/ai';
import { makeDeleteFavoriteUseCase } from '@/use-cases/ai/favorites/factories/make-delete-favorite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteFavoriteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/ai/favorites/:favoriteId',
    onRequest: [verifyJwt, verifyTenant],
    schema: {
      tags: ['AI - Favorites'],
      summary: 'Delete a favorite AI query',
      security: [{ bearerAuth: [] }],
      params: deleteFavoriteParamsSchema,
      response: {
        200: z.object({ success: z.boolean() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeDeleteFavoriteUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
        favoriteId: request.params.favoriteId,
      });

      return reply.status(200).send(result);
    },
  });
}
