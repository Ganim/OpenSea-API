import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import {
  permissionGroupSchema,
  updatePermissionGroupSchema,
} from '@/http/schemas/rbac.schema';
import { makeUpdatePermissionGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePermissionGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/rbac/permission-groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.UPDATE,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Update permission group',
      params: z.object({
        groupId: idSchema,
      }),
      body: updatePermissionGroupSchema,
      response: {
        200: z.object({
          group: permissionGroupSchema,
        }),
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
      const { name, description, color, priority, parentId, isActive } =
        request.body;

      try {
        const updatePermissionGroupUseCase = makeUpdatePermissionGroupUseCase();

        const { group } = await updatePermissionGroupUseCase.execute({
          groupId,
          name,
          description,
          color,
          priority,
          parentId,
          isActive,
        });

        return reply
          .status(200)
          .send({ group: PermissionGroupPresenter.toHTTP(group) });
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
