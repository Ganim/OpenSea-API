import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeDeleteEnterpriseUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteEnterpriseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/enterprises/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'Delete an enterprise',
      description: 'Soft deletes an enterprise (marks as deleted)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const deleteEnterpriseUseCase = makeDeleteEnterpriseUseCase();
        const result = await deleteEnterpriseUseCase.execute({ id });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
