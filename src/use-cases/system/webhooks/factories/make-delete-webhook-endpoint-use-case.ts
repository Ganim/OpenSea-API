import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { DeleteWebhookEndpointUseCase } from '../delete-webhook-endpoint';

export function makeDeleteWebhookEndpointUseCase() {
  return new DeleteWebhookEndpointUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
