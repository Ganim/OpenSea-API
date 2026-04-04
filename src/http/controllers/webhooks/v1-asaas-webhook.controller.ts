import { makeProcessWebhookUseCase } from '@/use-cases/sales/payment/factories/make-process-webhook-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1AsaasWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/webhooks/asaas',
    // NO JWT or tenant middleware — public endpoint called by Asaas
    schema: {
      tags: ['Webhooks'],
      summary: 'Receive Asaas webhook events (payment confirmed, failed, etc.)',
      body: z.record(z.string(), z.unknown()),
      response: {
        200: z.object({
          received: z.boolean(),
        }),
      },
    },
    handler: async (request, reply) => {
      const payload = request.body;
      const headers: Record<string, string> = {};

      // Extract relevant headers for access_token validation
      for (const [headerKey, headerValue] of Object.entries(request.headers)) {
        if (typeof headerValue === 'string') {
          headers[headerKey] = headerValue;
        }
      }

      try {
        const useCase = makeProcessWebhookUseCase();
        await useCase.execute({
          providerName: 'asaas',
          payload,
          headers,
        });
      } catch (error) {
        // Always return 200 to prevent provider retries — log internally
        console.error('[AsaasWebhook] Error processing webhook:', error);
      }

      // Always return 200 — even on failure — to prevent provider retries
      return reply.status(200).send({ received: true });
    },
  });
}
