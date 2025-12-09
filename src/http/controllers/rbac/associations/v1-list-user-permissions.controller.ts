import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import { permissionWithEffectSchema } from '@/http/schemas/rbac.schema';
import { makeListUserPermissionsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserPermissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/users/:userId/permissions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'List effective permissions of a user',
      params: z.object({
        userId: idSchema,
      }),
      querystring: z.object({
        module: z.string().optional(),
        resource: z.string().optional(),
        action: z.string().optional(),
      }),
      response: {
        200: z.object({
          permissions: z.array(permissionWithEffectSchema),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { module, resource, action } = request.query;

      try {
        const listUserPermissionsUseCase = makeListUserPermissionsUseCase();

        const { permissions } = await listUserPermissionsUseCase.execute({
          userId,
          module,
          resource,
          action,
        });

        const permissionsFormatted = permissions.map((item) => ({
          ...PermissionPresenter.toHTTP(item.permission),
          effect: item.effect,
          conditions: item.conditions as Record<string, unknown> | null,
        }));

        return reply.status(200).send({ permissions: permissionsFormatted });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
