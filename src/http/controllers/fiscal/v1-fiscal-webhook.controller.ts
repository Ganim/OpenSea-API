import { fiscalWebhookBodySchema } from '@/http/schemas/fiscal';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

/**
 * Public webhook endpoint for fiscal provider callbacks.
 *
 * This endpoint does NOT require authentication (public).
 * Provider-specific signature verification should be implemented
 * to ensure the callback is legitimate.
 */
export async function fiscalWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/fiscal',
    schema: {
      tags: ['Fiscal - Webhooks'],
      summary: 'Receive fiscal provider webhook callbacks (public)',
      description:
        'Public endpoint for fiscal providers to send status updates. ' +
        'Does not require authentication but verifies provider-specific signatures.',
      body: fiscalWebhookBodySchema,
      response: {
        200: z.object({ received: z.boolean() }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const webhookPayload = request.body;

      // TODO: Implement provider-specific signature verification
      // TODO: Look up the fiscal document by accessKey or externalId
      // TODO: Update the document status based on the webhook event
      // TODO: Create a FiscalDocumentEvent record

      console.log(
        '[FISCAL WEBHOOK] Received event:',
        webhookPayload.event,
        'accessKey:',
        webhookPayload.accessKey,
      );

      return reply.status(200).send({ received: true });
    },
  });
}
