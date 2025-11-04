import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeDeleteCustomerUseCase } from '@/use-cases/sales/customers/factories/make-delete-customer-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteCustomerController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/customers/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Customers'],
      summary: 'Delete customer (soft delete)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const useCase = makeDeleteCustomerUseCase();
        const result = await useCase.execute({ id });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
