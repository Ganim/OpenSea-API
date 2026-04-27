import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { ReactivateWebhookEndpointUseCase } from '../reactivate-webhook-endpoint';

export function makeReactivateWebhookEndpointUseCase() {
  return new ReactivateWebhookEndpointUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
