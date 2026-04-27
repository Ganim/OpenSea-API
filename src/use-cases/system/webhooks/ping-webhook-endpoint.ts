/**
 * PingWebhookEndpointUseCase — Phase 11 / Plan 11-02 / D-14.
 *
 * Cria evento sintético `webhook.ping` e enfileira na queue webhook-deliveries
 * (mesmo path que evento real). UI rastreia via polling/socket usando o
 * pingDeliveryId retornado.
 */
import { randomUUID } from 'node:crypto';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { createQueue } from '@/lib/queue';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export interface PingWebhookEndpointRequest {
  id: string;
  tenantId: string;
}

export interface PingWebhookEndpointResponse {
  pingDeliveryId: string;
  jobId: string;
}

export class PingWebhookEndpointUseCase {
  constructor(private repo: WebhookEndpointsRepository) {}

  async execute(
    input: PingWebhookEndpointRequest,
  ): Promise<PingWebhookEndpointResponse> {
    const endpoint = await this.repo.findById(input.id, input.tenantId);
    if (!endpoint) {
      throw new ResourceNotFoundError('Webhook não encontrado');
    }
    if (endpoint.status !== 'ACTIVE') {
      throw new BadRequestError(
        `Webhook não está ACTIVE (status: ${endpoint.status})`,
      );
    }

    const pingDeliveryId = `ping_${randomUUID()}`;
    const eventId = `evt_ping_${randomUUID()}`;

    const queue = createQueue('webhook-deliveries');
    const jobId = `${eventId}:${input.id}`;
    await queue.add(
      'webhook-deliveries-ping',
      {
        eventId,
        eventType: 'webhook.ping',
        tenantId: input.tenantId,
        endpointId: input.id,
        apiVersion: endpoint.apiVersion,
        eventData: {
          message: 'OpenSea webhook ping',
          timestamp: new Date().toISOString(),
        },
        ping: true,
      },
      {
        jobId,
        attempts: 1,
      },
    );

    return { pingDeliveryId, jobId };
  }
}
