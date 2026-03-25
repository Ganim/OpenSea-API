import { createHmac } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1WebhookShopeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/marketplace/shopee',
    schema: {
      tags: ['Sales - Marketplace Webhooks'],
      summary: 'Shopee push notification handler (public, HMAC verified)',
      body: z.object({
        shop_id: z.number(),
        code: z.number(),
        timestamp: z.number(),
        data: z.record(z.string(), z.unknown()).optional(),
      }),
      response: {
        200: z.object({ received: z.boolean() }),
        401: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const shopeePartnerKey = process.env.SHOPEE_PARTNER_KEY;

      if (shopeePartnerKey) {
        const authorizationHeader = request.headers['authorization'] as
          | string
          | undefined;

        if (authorizationHeader) {
          const rawBody = JSON.stringify(request.body);
          const expectedSignature = createHmac('sha256', shopeePartnerKey)
            .update(rawBody)
            .digest('hex');

          if (authorizationHeader !== expectedSignature) {
            return reply
              .status(401)
              .send({ message: 'Invalid webhook signature.' });
          }
        }
      }

      const { shop_id: shopId, code: pushCode } = request.body;

      app.log.info({ shopId, pushCode }, 'Shopee webhook received');

      // Shopee push codes: 0 (shop authorization), 3 (order status update),
      // 4 (tracking number), 5 (product ban), etc.
      // Actual processing delegated to job queue.

      return reply.status(200).send({ received: true });
    },
  });
}
