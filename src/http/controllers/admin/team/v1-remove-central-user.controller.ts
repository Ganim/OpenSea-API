import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeRemoveCentralUserUseCase } from '@/use-cases/admin/team/factories/make-remove-central-user';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RemoveCentralUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/team/:userId',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Team'],
      summary: 'Remove central team user (super admin)',
      description:
        'Removes a user from the Central team. Cannot remove the last OWNER.',
      params: z.object({
        userId: z.string().uuid(),
      }),
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
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;

      try {
        const removeCentralUserUseCase = makeRemoveCentralUserUseCase();
        const { success } = await removeCentralUserUseCase.execute({
          userId,
        });

        return reply.status(200).send({ success });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
