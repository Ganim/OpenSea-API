import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { PingWebhookEndpointUseCase } from '../ping-webhook-endpoint';

export function makePingWebhookEndpointUseCase() {
  return new PingWebhookEndpointUseCase(new PrismaWebhookEndpointsRepository());
}
