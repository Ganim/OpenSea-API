import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import { permissionSchema } from '@/http/schemas/rbac.schema';
import { makeGetPermissionByIdUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPermissionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions/:permissionId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'Get permission by ID',
      params: z.object({
        permissionId: idSchema,
      }),
      response: {
        200: z.object({
          permission: permissionSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { permissionId } = request.params;

      try {
        const getPermissionByIdUseCase = makeGetPermissionByIdUseCase();

        const { permission } = await getPermissionByIdUseCase.execute({
          id: permissionId,
        });

        return reply
          .status(200)
          .send({ permission: PermissionPresenter.toHTTP(permission) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
