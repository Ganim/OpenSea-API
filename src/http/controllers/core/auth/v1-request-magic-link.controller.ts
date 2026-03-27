import { makeRequestMagicLinkUseCase } from '@/use-cases/core/auth/factories/make-request-magic-link-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const bodySchema = z.object({
  identifier: z.string().min(1, 'Identificador é obrigatório'),
});

export async function requestMagicLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/auth/magic-link/request',
    schema: {
      tags: ['Auth'],
      summary: 'Request a magic link for passwordless login',
      body: bodySchema,
      response: {
        200: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { identifier } = request.body;

      const useCase = makeRequestMagicLinkUseCase();

      const { message } = await useCase.execute({ identifier });

      // Always return 200 — never reveal if the identifier exists
      return reply.status(200).send({ message });
    },
  });
}
