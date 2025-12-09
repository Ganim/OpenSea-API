import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { updateDirectPermissionSchema } from '@/http/schemas/rbac.schema';
import { makeUpdateDirectPermissionUseCase } from '@/use-cases/rbac/user-direct-permissions/factories/make-update-direct-permission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateDirectPermissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/rbac/users/direct-permissions/:id',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - User Direct Permissions'],
      summary: 'Update direct permission',
      params: z.object({
        id: idSchema,
      }),
      body: updateDirectPermissionSchema,
      response: {
        200: z.object({
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
      const { id } = request.params;
      const { effect, conditions, expiresAt } = request.body;

      try {
        const updateDirectPermissionUseCase =
          makeUpdateDirectPermissionUseCase();

        await updateDirectPermissionUseCase.execute({
          id,
          effect,
          conditions,
          expiresAt,
        });

        return reply.status(200).send({ success: true });
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
