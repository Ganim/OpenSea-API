import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserAdmin } from '@/http/middlewares/verify-user-admin';
import { idSchema } from '@/http/schemas/common.schema';
import { assignGroupToUserSchema } from '@/http/schemas/rbac.schema';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function assignGroupToUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/rbac/users/:userId/groups',
    preHandler: [verifyJwt, verifyUserAdmin],
    schema: {
      tags: ['RBAC - Associations'],
      summary: 'Assign permission group to user',
      params: z.object({
        userId: idSchema,
      }),
      body: assignGroupToUserSchema,
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
      const { groupId, expiresAt, grantedBy } = request.body;

      try {
        const assignGroupToUserUseCase = makeAssignGroupToUserUseCase();

        await assignGroupToUserUseCase.execute({
          userId,
          groupId,
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
