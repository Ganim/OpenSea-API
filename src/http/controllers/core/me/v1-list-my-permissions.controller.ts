import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { permissionWithEffectSchema } from '@/http/schemas/rbac.schema';
import { makeListUserPermissionsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMyPermissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/permissions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my effective permissions',
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
      const userId = request.user.sub;
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
