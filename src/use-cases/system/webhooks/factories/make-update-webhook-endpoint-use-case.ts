import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { UpdateWebhookEndpointUseCase } from '../update-webhook-endpoint';

export function makeUpdateWebhookEndpointUseCase() {
  return new UpdateWebhookEndpointUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
