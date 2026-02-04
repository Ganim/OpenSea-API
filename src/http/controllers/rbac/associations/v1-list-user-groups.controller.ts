import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import {
  listUserGroupsQuerySchema,
  permissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeListUserGroupsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserGroupsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/users/:userId/groups',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.READ,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'List permission groups of a user',
      params: z.object({
        userId: idSchema,
      }),
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
      const { userId } = request.params;
      const { includeExpired, includeInactive } = request.query;
      const tenantId = request.user.tenantId;

      try {
        const listUserGroupsUseCase = makeListUserGroupsUseCase();

        const { groups } = await listUserGroupsUseCase.execute({
          userId,
          includeExpired,
          includeInactive,
          tenantId,
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
