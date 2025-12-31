import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteCategoryUseCase } from '@/use-cases/stock/categories/factories/make-delete-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/categories/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.CATEGORIES.DELETE,
        resource: 'categories',
      }),
    ],
    schema: {
      tags: ['Stock - Categories'],
      summary: 'Delete a category (soft delete)',
      params: z.object({
        id: z.uuid(),
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
