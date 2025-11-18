import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import { idSchema } from '@/http/schemas/common.schema';
import {
  permissionSchema,
  updatePermissionSchema,
} from '@/http/schemas/rbac.schema';
import { makeUpdatePermissionUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/rbac/permissions/:permissionId',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'Update permission',
      params: z.object({
        permissionId: idSchema,
      }),
      body: updatePermissionSchema,
      response: {
        200: z.object({
          permission: permissionSchema,
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
      const { permissionId } = request.params;
      const { name, description, metadata } = request.body;

      try {
        const updatePermissionUseCase = makeUpdatePermissionUseCase();

        const { permission } = await updatePermissionUseCase.execute({
          permissionId,
          name,
          description,
          metadata,
        });

        return reply
          .status(200)
          .send({ permission: PermissionPresenter.toHTTP(permission) });
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
