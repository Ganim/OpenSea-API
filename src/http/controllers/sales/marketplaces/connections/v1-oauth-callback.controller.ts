import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1OauthCallbackController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace/oauth/callback',
    schema: {
      tags: ['Sales - Marketplace Integration'],
      summary: 'OAuth redirect handler for marketplace connections',
      querystring: z.object({
        code: z.string().min(1),
        state: z.string().min(1),
      }),
      response: {
        200: z.object({
          code: z.string(),
          state: z.string(),
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { code, state } = request.query;

      // The frontend will handle the actual connection via
      // POST /v1/marketplace-connections/:connectionId/connect
      // This endpoint just confirms the redirect was received.
      return reply.status(200).send({
        code,
        state,
        message:
          'OAuth callback received. Use the code to complete connection.',
      });
    },
  });
}
