import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeDeleteCategoryUseCase } from '@/use-cases/stock/categories/factories/make-delete-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/categories/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Categories'],
      summary: 'Delete a category (soft delete)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Category deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const deleteCategoryUseCase = makeDeleteCategoryUseCase();
        await deleteCategoryUseCase.execute({
          id,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
