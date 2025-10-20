import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeListCategoriesUseCase } from '@/use-cases/stock/categories/factories/make-list-categories-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listCategoriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/categories',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Categories'],
      summary: 'List all categories',
      response: {
        200: z.object({
          categories: z.array(
            z.object({
              id: z.string().uuid(),
              name: z.string(),
              slug: z.string(),
              description: z.string().nullable().optional(),
              parentId: z.string().uuid().nullable().optional(),
              displayOrder: z.number(),
              isActive: z.boolean(),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date().optional(),
            }),
          ),
        }),
      },
    },

    handler: async (request, reply) => {
      const listCategoriesUseCase = makeListCategoriesUseCase();
      const { categories } = await listCategoriesUseCase.execute();

      return reply.status(200).send({ categories });
    },
  });
}
