import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { makeRevokeDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-revoke-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function revokeDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/users/:userId/direct-permissions/:permissionId',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Revoke direct permission from user',
      params: z.object({
        userId: idSchema,
        permissionId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { userId, permissionId } = request.params;

      try {
        const revokeDirectPermissionUseCase =
          makeRevokeDirectPermissionUseCase();

        await revokeDirectPermissionUseCase.execute({
          userId,
          permissionId,
        });

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
