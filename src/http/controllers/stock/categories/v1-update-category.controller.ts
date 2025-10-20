import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeUpdateCategoryUseCase } from '@/use-cases/stock/categories/factories/make-update-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/categories/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Categories'],
      summary: 'Update a category',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        name: z.string().min(1).max(128).optional(),
        slug: z.string().min(1).max(128).optional(),
        description: z.string().max(500).optional(),
        parentId: z.string().uuid().nullable().optional(),
        displayOrder: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
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
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { name, slug, description, parentId, displayOrder, isActive } =
        request.body;

      try {
        const updateCategoryUseCase = makeUpdateCategoryUseCase();
        const { category } = await updateCategoryUseCase.execute({
          id,
          name,
          slug,
          description,
          parentId,
          displayOrder,
          isActive,
        });

        return reply.status(200).send({ category });
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
