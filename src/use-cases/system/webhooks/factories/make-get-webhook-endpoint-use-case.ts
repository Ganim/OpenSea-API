import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { GetWebhookEndpointUseCase } from '../get-webhook-endpoint';

export function makeGetWebhookEndpointUseCase() {
  return new GetWebhookEndpointUseCase(new PrismaWebhookEndpointsRepository());
}
