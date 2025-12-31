import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { deletePermissionGroupQuerySchema } from '@/http/schemas/rbac.schema';
import { makeDeletePermissionGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePermissionGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/rbac/permission-groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.DELETE,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Delete permission group (soft delete)',
      params: z.object({
        groupId: idSchema,
      }),
      querystring: deletePermissionGroupQuerySchema,
      response: {
        204: z.null(),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { groupId } = request.params;
      const { force } = request.query;

      try {
        const deletePermissionGroupUseCase = makeDeletePermissionGroupUseCase();

        await deletePermissionGroupUseCase.execute({
          groupId,
          force,
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
