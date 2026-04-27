import { PrismaWebhookDeliveriesRepository } from '@/repositories/system/prisma/prisma-webhook-deliveries-repository';
import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { ReprocessWebhookDeliveryUseCase } from '../reprocess-webhook-delivery';

export function makeReprocessWebhookDeliveryUseCase() {
  return new ReprocessWebhookDeliveryUseCase(
    new PrismaWebhookDeliveriesRepository(),
    new PrismaWebhookEndpointsRepository(),
  );
}
