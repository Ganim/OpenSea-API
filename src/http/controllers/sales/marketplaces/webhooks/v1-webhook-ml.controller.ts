import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebhookMlController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/marketplace/ml',
    schema: {
      tags: ['Sales - Marketplace Webhooks'],
      summary: 'Mercado Livre webhook notification handler (public)',
      body: z.object({
        resource: z.string(),
        user_id: z.number(),
        topic: z.string(),
        application_id: z.number().optional(),
        attempts: z.number().optional(),
        sent: z.string().optional(),
        received: z.string().optional(),
      }),
      response: {
        200: z.object({ received: z.boolean() }),
      },
    },
    handler: async (request, reply) => {
      const { topic, resource, user_id: mlUserId } = request.body;

      app.log.info(
        { topic, resource, mlUserId },
        'Mercado Livre webhook received',
      );

      // ML webhook topics: orders_v2, items, questions, payments, shipments
      // The actual processing will be handled asynchronously via a job queue.
      // For now, acknowledge receipt immediately to avoid ML retries.

      return reply.status(200).send({ received: true });
    },
  });
}
