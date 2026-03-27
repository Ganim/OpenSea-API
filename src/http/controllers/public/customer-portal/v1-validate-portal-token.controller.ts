import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { makeValidatePortalTokenUseCase } from '@/use-cases/finance/customer-portal/factories/make-validate-portal-token-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function validatePortalTokenController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/customer-portal/:token/validate',
    schema: {
      tags: ['Public - Customer Portal'],
      summary: 'Validate a customer portal access token',
      params: z.object({
        token: z.string().min(1),
      }),
      response: {
        200: z.object({
          valid: z.boolean(),
          customerName: z.string().nullable(),
          expiresAt: z.string().nullable(),
        }),
        401: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { token } = request.params;

      try {
        const useCase = makeValidatePortalTokenUseCase();
        const { access } = await useCase.execute({ token });

        return reply.status(200).send({
          valid: true,
          customerName: access.customerName,
          expiresAt: access.expiresAt?.toISOString() ?? null,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
