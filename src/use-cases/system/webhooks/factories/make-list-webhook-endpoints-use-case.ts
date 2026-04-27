import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { ListWebhookEndpointsUseCase } from '../list-webhook-endpoints';

export function makeListWebhookEndpointsUseCase() {
  return new ListWebhookEndpointsUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
