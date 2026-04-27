import { ReprocessWebhookDeliveriesBulkUseCase } from '../reprocess-webhook-deliveries-bulk';
import { makeReprocessWebhookDeliveryUseCase } from './make-reprocess-webhook-delivery-use-case';

export function makeReprocessWebhookDeliveriesBulkUseCase() {
  return new ReprocessWebhookDeliveriesBulkUseCase(
    makeReprocessWebhookDeliveryUseCase(),
  );
}
