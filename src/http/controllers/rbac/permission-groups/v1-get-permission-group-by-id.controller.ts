import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionGroupPresenter } from '@/http/presenters/rbac/permission-group-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import { permissionGroupWithDetailsSchema } from '@/http/schemas/rbac.schema';
import { makeGetPermissionGroupByIdUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPermissionGroupByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permission-groups/:groupId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.GROUPS.READ,
        resource: 'permission-groups',
      }),
    ],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Get permission group by ID with users and permissions',
      description:
        'Retorna os detalhes de um grupo de permissoes, incluindo usuarios associados e permissoes atribuidas ao grupo.',
      security: [{ bearerAuth: [] }],
      params: z.object({
        groupId: idSchema,
      }),
      response: {
        200: z.object({
          group: permissionGroupWithDetailsSchema,
        }),
        403: z.object({
          message: z.string(),
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
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const result = await getPermissionGroupByIdUseCase.execute({
          id: groupId,
          tenantId,
        });

        return reply
          .status(200)
          .send({ group: PermissionGroupPresenter.toHTTPWithDetails(result) });
      } catch (error) {
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
