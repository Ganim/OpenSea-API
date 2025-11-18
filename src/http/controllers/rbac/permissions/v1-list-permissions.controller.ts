import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import {
  listPermissionsQuerySchema,
  permissionSchema,
} from '@/http/schemas/rbac.schema';
import { makeListPermissionsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPermissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'List permissions with filters',
      querystring: listPermissionsQuerySchema,
      response: {
        200: z.object({
          permissions: z.array(permissionSchema),
          total: z.number(),
          totalPages: z.number(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { module, resource, action, isSystem, page, limit } = request.query;

      const listPermissionsUseCase = makeListPermissionsUseCase();

      const { permissions, total } = await listPermissionsUseCase.execute({
        module,
        resource,
        action,
        isSystem,
        page,
        limit,
      });

      const totalPages = Math.ceil(total / (limit || 20));

      return reply.status(200).send({
        permissions: PermissionPresenter.toHTTPMany(permissions),
        total,
        totalPages,
      });
    },
  });
}
