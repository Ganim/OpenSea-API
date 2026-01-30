import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeReorderCategoriesUseCase } from '@/use-cases/stock/categories/factories/make-reorder-categories-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function reorderCategoriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/categories/reorder',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.CATEGORIES.UPDATE,
        resource: 'categories',
      }),
    ],
    schema: {
      tags: ['Stock - Categories'],
      summary: 'Reorder categories in batch',
      body: z.object({
        items: z.array(
          z.object({
            id: z.uuid(),
            displayOrder: z.number().int().min(0),
          }),
        ),
      }),
      response: {
        204: z.null().describe('Categories reordered successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { items } = request.body;

      try {
        const reorderCategoriesUseCase = makeReorderCategoriesUseCase();
        await reorderCategoriesUseCase.execute({ items });

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
