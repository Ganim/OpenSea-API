import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import {
  permissionCodeSchema,
  permissionSchema,
} from '@/http/schemas/rbac.schema';
import { makeGetPermissionByCodeUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPermissionByCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/rbac/permissions/code/:code',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.PERMISSIONS.READ,
        resource: 'permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'Get permission by code',
      params: z.object({
        code: permissionCodeSchema,
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
      const { code } = request.params;

      try {
        const getPermissionByCodeUseCase = makeGetPermissionByCodeUseCase();

        const { permission } = await getPermissionByCodeUseCase.execute({
          code,
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
