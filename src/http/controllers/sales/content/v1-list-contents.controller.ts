import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listGeneratedContentsQuerySchema, generatedContentResponseSchema } from '@/http/schemas';
import { generatedContentToDTO } from '@/mappers/sales/generated-content/generated-content-to-dto';
import { makeListGeneratedContentsUseCase } from '@/use-cases/sales/generated-contents/factories/make-list-generated-contents-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listContentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/content',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTENT.ACCESS,
        resource: 'content',
      }),
    ],
    schema: {
      tags: ['Sales - Content'],
      summary: 'List generated contents',
      querystring: listGeneratedContentsQuerySchema,
      response: {
        200: z.object({
          data: z.array(generatedContentResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListGeneratedContentsUseCase();
      const { contents } = await useCase.execute({
        tenantId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        type: query.type,
        status: query.status,
        catalogId: query.catalogId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        data: contents.data.map((c) => generatedContentToDTO(c)),
        meta: {
          total: contents.total,
          page: contents.page,
          limit: contents.limit,
          pages: contents.totalPages,
        },
      });
    },
  });
}
