import {
  pixWebhookBodySchema,
  pixWebhookResponseSchema,
} from '@/http/schemas/cashier/pix.schema';
import { makeReceivePixWebhookUseCase } from '@/use-cases/cashier/factories/make-receive-pix-webhook-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1PixWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/pix',
    // Public endpoint - no auth middleware
    schema: {
      tags: ['Webhooks'],
      summary: 'Receive PIX payment webhook (public)',
      description:
        'Public endpoint called by the PIX provider (e.g. Efi) when a payment is confirmed. Validates the webhook signature via mTLS or provider-specific mechanism.',
      body: pixWebhookBodySchema,
      response: {
        200: pixWebhookResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const rawPayload = request.body;
      const signature =
        (request.headers['x-webhook-signature'] as string) ?? '';

      try {
        const useCase = makeReceivePixWebhookUseCase();
        await useCase.execute({ rawPayload, signature });

        return reply.status(200).send({ acknowledged: true });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown webhook error';
        return reply.status(400).send({ message: errorMessage });
      }
    },
  });
}
