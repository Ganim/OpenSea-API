/**
 * ReprocessWebhookDeliveryUseCase — Phase 11 / Plan 11-02 / D-21, D-22.
 *
 * Reenvio manual de delivery:
 *   - max 3 reenvios (D-21) — 4ª chamada lança 422
 *   - cooldown 30s (D-21) — chamada em <30s lança 422
 *   - jobId determinístico `${eventId}:${webhookId}:retry-${count}` (D-22)
 *   - attempts: 1 (D-22 — sem retry curve em manual)
 */
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TooManyRequestsError } from '@/@errors/use-cases/too-many-requests-error';
import {
  MANUAL_REPROCESS_COOLDOWN_MS,
  MAX_MANUAL_REPROCESS,
} from '@/entities/system/webhook-delivery';
import { createQueue } from '@/lib/queue';
import type { WebhookDeliveriesRepository } from '@/repositories/system/webhook-deliveries-repository';
import type { WebhookEndpointsRepository } from '@/repositories/system/webhook-endpoints-repository';

export class ManualReprocessCapReachedError extends BadRequestError {
  constructor() {
    super(
      `Esta entrega já foi reenviada ${MAX_MANUAL_REPROCESS} vezes — limite atingido (D-21).`,
    );
  }
}

export class ManualReprocessCooldownError extends TooManyRequestsError {
  constructor(secondsRemaining: number) {
    super(
      `Aguarde ${secondsRemaining}s antes do próximo reenvio manual (D-21 cooldown 30s).`,
    );
  }
}

export interface ReprocessWebhookDeliveryRequest {
  deliveryId: string;
  tenantId: string;
  actorUserId?: string;
}

export interface ReprocessWebhookDeliveryResponse {
  deliveryId: string;
  newReprocessCount: number;
  enqueued: true;
  jobId: string;
}

export class ReprocessWebhookDeliveryUseCase {
  constructor(
    private deliveriesRepo: WebhookDeliveriesRepository,
    private endpointsRepo: WebhookEndpointsRepository,
  ) {}

  async execute(
    input: ReprocessWebhookDeliveryRequest,
  ): Promise<ReprocessWebhookDeliveryResponse> {
    const delivery = await this.deliveriesRepo.findById(
      input.deliveryId,
      input.tenantId,
    );
    if (!delivery) {
      throw new ResourceNotFoundError('Delivery não encontrada');
    }

    // D-21 cap 3
    if (delivery.manualReprocessCount >= MAX_MANUAL_REPROCESS) {
      throw new ManualReprocessCapReachedError();
    }

    // D-21 cooldown 30s
    if (delivery.lastManualReprocessAt) {
      const elapsed = Date.now() - delivery.lastManualReprocessAt.getTime();
      if (elapsed < MANUAL_REPROCESS_COOLDOWN_MS) {
        const remaining = Math.ceil(
          (MANUAL_REPROCESS_COOLDOWN_MS - elapsed) / 1000,
        );
        throw new ManualReprocessCooldownError(remaining);
      }
    }

    const endpoint = await this.endpointsRepo.findById(
      delivery.endpointId.toString(),
      input.tenantId,
    );
    if (!endpoint) {
      throw new ResourceNotFoundError('Endpoint não encontrado');
    }

    // Atomic increment manualReprocessCount + lastManualReprocessAt
    const { newCount } = await this.deliveriesRepo.incrementManualReprocess(
      input.deliveryId,
      input.tenantId,
    );

    // D-22 jobId determinístico + attempts: 1 (tentativa única)
    const jobId = `${delivery.eventId}:${delivery.endpointId.toString()}:retry-${newCount}`;
    const queue = createQueue('webhook-deliveries');
    await queue.add(
      'webhook-deliveries-manual',
      {
        eventId: delivery.eventId,
        eventType: delivery.eventType,
        tenantId: input.tenantId,
        endpointId: delivery.endpointId.toString(),
        apiVersion: endpoint.apiVersion,
        manualReprocess: true,
        deliveryId: input.deliveryId,
      },
      {
        jobId,
        attempts: 1,
      },
    );

    return {
      deliveryId: input.deliveryId,
      newReprocessCount: newCount,
      enqueued: true,
      jobId,
    };
  }
}
