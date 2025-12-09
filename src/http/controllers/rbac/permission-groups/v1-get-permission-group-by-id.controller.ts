import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
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
    preHandler: [verifyJwt],
    schema: {
      tags: ['RBAC - Permission Groups'],
      summary: 'Get permission group by ID with users and permissions',
      params: z.object({
        groupId: idSchema,
      }),
      response: {
        200: z.object({
          group: permissionGroupWithDetailsSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { groupId } = request.params;

      try {
        const getPermissionGroupByIdUseCase =
          makeGetPermissionGroupByIdUseCase();

        const result = await getPermissionGroupByIdUseCase.execute({
          id: groupId,
        });

        return reply
          .status(200)
          .send({ group: PermissionGroupPresenter.toHTTPWithDetails(result) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
