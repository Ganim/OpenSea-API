import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyWebhookSignature } from '@/http/middlewares/finance/verify-webhook-signature';
import { makeProcessBankWebhookUseCase } from '@/use-cases/finance/webhooks/factories/make-process-bank-webhook-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ErrorCodes } from '@/@errors/error-codes';
import { errorResponseSchema } from '@/http/schemas/common/error-response.schema';

export async function sicoobWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/webhooks/sicoob',
    // No JWT auth — Sicoob calls this endpoint directly.
    // Authenticity is verified via HMAC-SHA256 webhook signature over the raw body.
    config: {
      // Opt this route into raw body capture so the HMAC signature in
      // verifyWebhookSignature can be computed against the byte-stream Sicoob
      // actually signed (key order / whitespace preserved).
      rawBody: true,
    },
    schema: {
      tags: ['Finance - Webhooks'],
      summary: 'Receive Sicoob bank webhook events (PIX received, boleto paid)',
      querystring: z.object({
        bankAccountId: z.string().uuid(),
      }),
      body: z.record(z.string(), z.unknown()),
      response: {
        200: z.object({
          received: z.boolean(),
          matched: z.boolean(),
          autoSettled: z.boolean(),
        }),
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
    preHandler: [verifyWebhookSignature],
    handler: async (request, reply) => {
      const { bankAccountId } = request.query;
      const payload = request.body;

      // tenantId was resolved and attached by verifyWebhookSignature — no extra DB call needed
      const tenantId = (
        request as FastifyRequest & { bankAccountTenantId: string }
      ).bankAccountTenantId;

      try {
        const useCase = makeProcessBankWebhookUseCase();
        const result = await useCase.execute({
          tenantId,
          bankAccountId,
          provider: 'SICOOB',
          payload,
        });

        return reply.status(200).send({
          received: true,
          matched: result.matched,
          autoSettled: result.autoSettled,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
            message: error.message,
            requestId: request.requestId,
          });
        }
        throw error;
      }
    },
  });
}
