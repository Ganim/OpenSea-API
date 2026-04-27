import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { CreateWebhookEndpointUseCase } from '../create-webhook-endpoint';

export function makeCreateWebhookEndpointUseCase() {
  return new CreateWebhookEndpointUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
