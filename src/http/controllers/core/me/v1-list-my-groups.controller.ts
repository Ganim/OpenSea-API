import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import {
  listUserGroupsQuerySchema,
  permissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeListUserGroupsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMyGroupsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/groups',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my permission groups',
      querystring: listUserGroupsQuerySchema,
      response: {
        200: z.object({
          groups: z.array(permissionGroupSchema),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { includeExpired, includeInactive } = request.query;

      try {
        const listUserGroupsUseCase = makeListUserGroupsUseCase();

        const { groups } = await listUserGroupsUseCase.execute({
          userId,
          includeExpired,
          includeInactive,
        });

        return reply
          .status(200)
          .send({ groups: PermissionGroupPresenter.toHTTPMany(groups) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
