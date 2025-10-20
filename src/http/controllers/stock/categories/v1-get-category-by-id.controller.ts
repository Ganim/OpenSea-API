import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeGetCategoryByIdUseCase } from '@/use-cases/stock/categories/factories/make-get-category-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getCategoryByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/categories/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Categories'],
      summary: 'Get a category by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          category: z.object({
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
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getCategoryByIdUseCase = makeGetCategoryByIdUseCase();
        const { category } = await getCategoryByIdUseCase.execute({
          id,
        });

        return reply.status(200).send({ category });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
