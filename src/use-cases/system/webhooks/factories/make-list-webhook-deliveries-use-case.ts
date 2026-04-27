import { PrismaWebhookDeliveriesRepository } from '@/repositories/system/prisma/prisma-webhook-deliveries-repository';
import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { ListWebhookDeliveriesUseCase } from '../list-webhook-deliveries';

export function makeListWebhookDeliveriesUseCase() {
  return new ListWebhookDeliveriesUseCase(
    new PrismaWebhookEndpointsRepository(),
    new PrismaWebhookDeliveriesRepository(),
  );
}
