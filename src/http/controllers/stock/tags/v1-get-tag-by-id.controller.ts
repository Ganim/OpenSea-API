import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { tagResponseSchema } from '@/http/schemas/stock.schema';
import { makeGetTagByIdUseCase } from '@/use-cases/stock/tags/factories/make-get-tag-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getTagByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tags/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.ADMIN,
        resource: 'tags',
      }),
    ],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Get a tag by ID',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({
          tag: tagResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const getTagById = makeGetTagByIdUseCase();
      const { id } = request.params as { id: string };

      const { tag } = await getTagById.execute({ tenantId, id });

      return reply.status(200).send({ tag });
    },
  });
}
