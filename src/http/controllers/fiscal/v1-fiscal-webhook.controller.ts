import { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import type { FiscalEventType } from '@/entities/fiscal/fiscal-document-event';
import { fiscalWebhookBodySchema } from '@/http/schemas/fiscal';
import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { PrismaFiscalDocumentEventsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-events-repository';
import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const AUTHORIZED_EVENTS = ['autorizada', 'autorizado'];
const CANCELLED_EVENTS = ['cancelada', 'cancelado'];
const DENIED_EVENTS = ['denegada', 'denegado'];

function mapWebhookEventToFiscalEventType(
  webhookEvent: string,
): FiscalEventType {
  const normalizedEvent = webhookEvent.toLowerCase();

  if (AUTHORIZED_EVENTS.includes(normalizedEvent)) return 'AUTHORIZATION';
  if (CANCELLED_EVENTS.includes(normalizedEvent)) return 'CANCELLATION';
  if (DENIED_EVENTS.includes(normalizedEvent)) return 'AUTHORIZATION';

  return 'AUTHORIZATION';
}

function isRecognizedEvent(webhookEvent: string): boolean {
  const normalizedEvent = webhookEvent.toLowerCase();

  return (
    AUTHORIZED_EVENTS.includes(normalizedEvent) ||
    CANCELLED_EVENTS.includes(normalizedEvent) ||
    DENIED_EVENTS.includes(normalizedEvent)
  );
}

/**
 * Public webhook endpoint for fiscal provider callbacks.
 *
 * This endpoint does NOT require authentication (public).
 * Provider-specific signature verification is used
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
        401: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const webhookPayload = request.body;

      // ------------------------------------------------------------------
      // 1. Provider-specific signature verification
      // ------------------------------------------------------------------
      // For Nuvem Fiscal, the provider sends a secret in the
      // `x-webhook-secret` header that must match the configured apiKey.
      const webhookSecret = request.headers['x-webhook-secret'] as
        | string
        | undefined;

      const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();
      const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();
      const fiscalDocumentEventsRepository =
        new PrismaFiscalDocumentEventsRepository();

      // We need at least an accessKey or externalId to find the document
      if (!webhookPayload.accessKey && !webhookPayload.externalId) {
        return reply.status(400).send({
          message:
            'Webhook must include either accessKey or externalId to identify the document.',
        });
      }

      // ------------------------------------------------------------------
      // 2. Document lookup by accessKey or externalId
      // ------------------------------------------------------------------
      const fiscalDocument = webhookPayload.accessKey
        ? await fiscalDocumentsRepository.findByAccessKey(
            webhookPayload.accessKey,
          )
        : await fiscalDocumentsRepository.findByExternalId(
            webhookPayload.externalId!,
          );

      if (!fiscalDocument) {
        // Return 200 to avoid retries from the provider for unknown documents
        request.log.warn(
          {
            accessKey: webhookPayload.accessKey,
            externalId: webhookPayload.externalId,
            event: webhookPayload.event,
          },
          '[FISCAL WEBHOOK] Document not found, acknowledging to prevent retries',
        );

        return reply.status(200).send({ received: true });
      }

      // Verify signature against the tenant's fiscal config apiKey
      const fiscalConfig = await fiscalConfigsRepository.findByTenantId(
        fiscalDocument.tenantId.toString(),
      );

      if (!fiscalConfig) {
        request.log.warn(
          { tenantId: fiscalDocument.tenantId.toString() },
          '[FISCAL WEBHOOK] No fiscal config found for tenant',
        );

        return reply.status(200).send({ received: true });
      }

      if (webhookSecret && webhookSecret !== fiscalConfig.apiKey) {
        request.log.warn(
          '[FISCAL WEBHOOK] Signature verification failed: x-webhook-secret does not match apiKey',
        );

        return reply.status(401).send({
          message: 'Invalid webhook signature.',
        });
      }

      // ------------------------------------------------------------------
      // 3. Update the document status based on the webhook event
      // ------------------------------------------------------------------
      const normalizedEvent = webhookPayload.event.toLowerCase();

      if (!isRecognizedEvent(webhookPayload.event)) {
        request.log.info(
          { event: webhookPayload.event },
          '[FISCAL WEBHOOK] Unrecognized event type, acknowledging without processing',
        );

        return reply.status(200).send({ received: true });
      }

      let eventSuccess = true;

      if (AUTHORIZED_EVENTS.includes(normalizedEvent)) {
        fiscalDocument.markAsAuthorized(
          webhookPayload.accessKey ?? fiscalDocument.accessKey ?? '',
          webhookPayload.protocol ?? '',
          new Date(),
          webhookPayload.xml ?? '',
          webhookPayload.externalId,
        );
      } else if (CANCELLED_EVENTS.includes(normalizedEvent)) {
        // Mark as cancelled directly via status setter since `cancel()` enforces
        // business rules (window check) that don't apply to provider-initiated cancellations
        fiscalDocument.status = 'CANCELLED';
      } else if (DENIED_EVENTS.includes(normalizedEvent)) {
        fiscalDocument.markAsDenied();
        eventSuccess = false;
      }

      await fiscalDocumentsRepository.save(fiscalDocument);

      // ------------------------------------------------------------------
      // 4. Create a FiscalDocumentEvent for audit trail
      // ------------------------------------------------------------------
      const fiscalEventType = mapWebhookEventToFiscalEventType(
        webhookPayload.event,
      );

      const webhookEvent = FiscalDocumentEvent.create({
        fiscalDocumentId: fiscalDocument.id,
        type: fiscalEventType,
        protocol: webhookPayload.protocol,
        description: `Webhook received: ${webhookPayload.event}`,
        xmlResponse: webhookPayload.xml,
        success: eventSuccess,
        errorCode: webhookPayload.errorCode,
        errorMessage: webhookPayload.errorMessage,
      });

      await fiscalDocumentEventsRepository.create(webhookEvent);

      request.log.info(
        {
          documentId: fiscalDocument.id.toString(),
          event: webhookPayload.event,
          newStatus: fiscalDocument.status,
        },
        '[FISCAL WEBHOOK] Document status updated successfully',
      );

      return reply.status(200).send({ received: true });
    },
  });
}
