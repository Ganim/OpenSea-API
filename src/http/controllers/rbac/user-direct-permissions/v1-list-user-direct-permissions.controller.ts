import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import {
  listUserDirectPermissionsQuerySchema,
  permissionWithEffectSchema,
} from '@/http/schemas/rbac.schema';
import { makeListUserDirectPermissionsUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-list-user-direct-permissions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listUserDirectPermissionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/users/:userId/direct-permissions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.USER_PERMISSIONS.READ,
        resource: 'user-permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'List user direct permissions',
      params: z.object({
        userId: idSchema,
      }),
      querystring: listUserDirectPermissionsQuerySchema,
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
      const { includeExpired, effect } = request.query;

      try {
        const listUserDirectPermissionsUseCase =
          makeListUserDirectPermissionsUseCase();

        const { permissions } = await listUserDirectPermissionsUseCase.execute({
          userId,
          includeExpired,
          effect,
        });

        const permissionsWithEffect = permissions.map((item) => ({
          ...PermissionPresenter.toHTTP(item.permission),
          effect: item.effect,
          conditions: item.conditions,
        }));

        return reply.status(200).send({ permissions: permissionsWithEffect });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
