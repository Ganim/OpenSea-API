import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { makeGetAvailableAuthMethodsUseCase } from '@/use-cases/core/auth/factories/make-get-available-auth-methods-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const querystringSchema = z.object({
  tenantId: z.uuid().optional(),
});

const authMethodEnum = z.enum([
  'EMAIL',
  'CPF',
  'ENROLLMENT',
  'GOOGLE',
  'MICROSOFT',
  'APPLE',
  'GITHUB',
]);

export async function getAuthMethodsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/auth/methods',
    schema: {
      tags: ['Auth'],
      summary: 'Get available authentication methods',
      querystring: querystringSchema,
      response: {
        200: z.object({
          methods: z.array(authMethodEnum),
          magicLinkEnabled: z.boolean(),
          defaultMethod: authMethodEnum.nullable(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { tenantId } = request.query;

      const useCase = makeGetAvailableAuthMethodsUseCase();

      const result = await useCase.execute({
        tenantId: tenantId ? new UniqueEntityID(tenantId) : undefined,
      });

      return reply.status(200).send(result);
    },
  });
}
