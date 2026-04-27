/**
 * ReprocessWebhookDeliveriesBulkUseCase — Phase 11 / Plan 11-02.
 *
 * Itera N deliveries chamando reprocess individual mas SEM rolar back em erro
 * de cap/cooldown — agrega em { enqueued, skippedCap, skippedCooldown }.
 */
import {
  ManualReprocessCapReachedError,
  ManualReprocessCooldownError,
  ReprocessWebhookDeliveryUseCase,
} from './reprocess-webhook-delivery';

export interface ReprocessWebhookDeliveriesBulkRequest {
  deliveryIds: string[];
  tenantId: string;
  actorUserId?: string;
}

export interface ReprocessWebhookDeliveriesBulkResponse {
  enqueued: number;
  skippedCap: string[];
  skippedCooldown: string[];
  skippedNotFound: string[];
  /** delivery ids that errored for OTHER reasons (queue add failure etc.) */
  errors: { deliveryId: string; message: string }[];
}

export class ReprocessWebhookDeliveriesBulkUseCase {
  constructor(private singleUseCase: ReprocessWebhookDeliveryUseCase) {}

  async execute(
    input: ReprocessWebhookDeliveriesBulkRequest,
  ): Promise<ReprocessWebhookDeliveriesBulkResponse> {
    let enqueued = 0;
    const skippedCap: string[] = [];
    const skippedCooldown: string[] = [];
    const skippedNotFound: string[] = [];
    const errors: { deliveryId: string; message: string }[] = [];

    for (const deliveryId of input.deliveryIds) {
      try {
        await this.singleUseCase.execute({
          deliveryId,
          tenantId: input.tenantId,
          actorUserId: input.actorUserId,
        });
        enqueued += 1;
      } catch (err) {
        if (err instanceof ManualReprocessCapReachedError) {
          skippedCap.push(deliveryId);
        } else if (err instanceof ManualReprocessCooldownError) {
          skippedCooldown.push(deliveryId);
        } else if (
          err instanceof Error &&
          err.message.toLowerCase().includes('não encontrada')
        ) {
          skippedNotFound.push(deliveryId);
        } else {
          errors.push({
            deliveryId,
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return { enqueued, skippedCap, skippedCooldown, skippedNotFound, errors };
  }
}
