import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import { permissionWithEffectSchema } from '@/http/schemas/rbac.schema';
import { makeListGroupPermissionsUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listGroupPermissionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permission-groups/:groupId/permissions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.ASSOCIATIONS.READ,
        resource: 'associations',
      }),
    ],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'List permissions of a group',
      params: z.object({
        groupId: idSchema,
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
      const { groupId } = request.params;
      const tenantId = request.user.tenantId;

      try {
        const listGroupPermissionsUseCase = makeListGroupPermissionsUseCase();

        const { permissions } = await listGroupPermissionsUseCase.execute({
          groupId,
          tenantId,
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
