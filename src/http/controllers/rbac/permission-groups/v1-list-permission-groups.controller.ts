import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import {
  listPermissionGroupsQuerySchema,
  permissionGroupWithDetailsSchema,
} from '@/http/schemas/rbac.schema';
import { makeListPermissionGroupsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPermissionGroupsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permission-groups',
    preHandler: [verifyJwt],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'List permission groups with filters',
      querystring: listPermissionGroupsQuerySchema,
      response: {
        200: z.object({
          groups: z.array(permissionGroupWithDetailsSchema),
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { isActive, isSystem, page = 1, limit = 20 } = request.query;

      const listPermissionGroupsUseCase = makeListPermissionGroupsUseCase();

      const { groups } = await listPermissionGroupsUseCase.execute({
        isActive,
        isSystem,
      });

      const total = groups.length;
      const totalPages = Math.ceil(total / limit);

      // Aplicar paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedGroups = groups.slice(startIndex, endIndex);

      const presentedGroups = paginatedGroups.map((data) =>
        PermissionGroupPresenter.toHTTPWithDetails(data),
      );

      return reply.status(200).send({
        groups: presentedGroups,
        total,
        page,
        limit,
        totalPages,
      });
    },
  });
}
