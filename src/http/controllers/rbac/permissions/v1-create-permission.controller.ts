import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { PermissionPresenter } from '@/http/presenters/rbac/permission-presenter';
import {
  createPermissionSchema,
  permissionSchema,
} from '@/http/schemas/rbac.schema';
import { makeCreatePermissionUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/permissions',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.RBAC.PERMISSIONS.CREATE,
        resource: 'permissions',
      }),
    ],
    schema: {
      tags: ['RBAC - Permissions'],
      summary: 'Create a new permission',
      body: createPermissionSchema,
      response: {
        201: z.object({
          permission: permissionSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { code, name, description, module, resource, action, metadata } =
        request.body;

      try {
        const createPermissionUseCase = makeCreatePermissionUseCase();

        const { permission } = await createPermissionUseCase.execute({
          code,
          name,
          description: description ?? null,
          module,
          resource,
          action,
          metadata: metadata ?? {},
        });

        return reply
          .status(201)
          .send({ permission: PermissionPresenter.toHTTP(permission) });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
