import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { addPermissionToGroupSchema } from '@/http/schemas/rbac.schema';
import { makeAddPermissionToGroupUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function addPermissionToGroupController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/permission-groups/:groupId/permissions',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Add permission to group',
      params: z.object({
        groupId: idSchema,
      }),
      body: addPermissionToGroupSchema,
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
      const { groupId } = request.params;
      const { permissionCode, effect, conditions } = request.body;

      try {
        const addPermissionToGroupUseCase = makeAddPermissionToGroupUseCase();

        await addPermissionToGroupUseCase.execute({
          groupId,
          permissionCode,
          effect: effect ?? 'allow',
          conditions: conditions ?? null,
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
