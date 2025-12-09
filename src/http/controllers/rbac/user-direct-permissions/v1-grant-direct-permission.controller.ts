import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { grantDirectPermissionSchema } from '@/http/schemas/rbac.schema';
import { makeGrantDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-grant-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function grantDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/users/:userId/direct-permissions',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Grant direct permission to user',
      params: z.object({
        userId: idSchema,
      }),
      body: grantDirectPermissionSchema,
      response: {
        201: z.object({
          success: z.boolean(),
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
      const { userId } = request.params;
      const { permissionId, effect, conditions, expiresAt, grantedBy } =
        request.body;

      try {
        const grantDirectPermissionUseCase = makeGrantDirectPermissionUseCase();

        await grantDirectPermissionUseCase.execute({
          userId,
          permissionId,
          effect,
          conditions,
          expiresAt: expiresAt ?? null,
          grantedBy: grantedBy ?? null,
        });

        return reply.status(201).send({ success: true });
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
