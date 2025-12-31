import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { makeRemoveGroupFromUserUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function removeGroupFromUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/users/:userId/groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_GROUPS.MANAGE,
        resource: 'user-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Remove permission group from user',
      params: z.object({
        userId: idSchema,
        groupId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { userId, groupId } = request.params;

      try {
        const removeGroupFromUserUseCase = makeRemoveGroupFromUserUseCase();

        await removeGroupFromUserUseCase.execute({
          userId,
          groupId,
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
