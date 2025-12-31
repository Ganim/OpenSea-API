import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { listUsersByGroupQuerySchema } from '@/http/schemas/rbac.schema';
import { makeListUsersByGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUsersByGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permission-groups/:groupId/users',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.READ,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'List users in a permission group',
      params: z.object({
        groupId: idSchema,
      }),
      querystring: listUsersByGroupQuerySchema,
      response: {
        200: z.object({
          userIds: z.array(z.string()),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { groupId } = request.params;
      const { includeExpired } = request.query;

      try {
        const listUsersByGroupUseCase = makeListUsersByGroupUseCase();

        const { userIds } = await listUsersByGroupUseCase.execute({
          groupId,
          includeExpired,
        });

        return reply.status(200).send({ userIds });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
