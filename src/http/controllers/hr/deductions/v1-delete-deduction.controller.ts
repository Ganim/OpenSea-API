import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { idSchema } from '@/http/schemas';
import { makeDeleteDeductionUseCase } from '@/use-cases/hr/deductions/factories/make-delete-deduction-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteDeductionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/deductions/:deductionId',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Deduction'],
      summary: 'Delete a deduction',
      description: 'Soft deletes a deduction',
      params: z.object({
        deductionId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { deductionId } = request.params;

      try {
        const deleteDeductionUseCase = makeDeleteDeductionUseCase();
        await deleteDeductionUseCase.execute({ deductionId });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
