import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { makeListUsersByPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-list-users-by-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUsersByPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions/:permissionId/users',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'List users with direct permission',
      params: z.object({
        permissionId: idSchema,
      }),
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
      const { permissionId } = request.params;

      try {
        const listUsersByPermissionUseCase = makeListUsersByPermissionUseCase();

        const { userIds } = await listUsersByPermissionUseCase.execute({
          permissionId,
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
