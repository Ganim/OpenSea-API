import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { makeRemovePermissionFromGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removePermissionFromGroupController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/permission-groups/:groupId/permissions/:permissionId',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Remove permission from group',
      params: z.object({
        groupId: idSchema,
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
      const { groupId, permissionId } = request.params;

      try {
        const removePermissionFromGroupUseCase =
          makeRemovePermissionFromGroupUseCase();

        await removePermissionFromGroupUseCase.execute({
          groupId,
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
