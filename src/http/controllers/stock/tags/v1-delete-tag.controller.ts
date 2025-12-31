import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { makeDeleteTagUseCase } from '@/use-cases/stock/tags/factories/make-delete-tag-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteTagController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/tags/:id',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.TAGS.DELETE,
        resource: 'tags',
      }),
    ],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Delete a tag',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Tag deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const deleteTag = makeDeleteTagUseCase();
      const { id } = request.params as { id: string };

      try {
        await deleteTag.execute({ id });

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
