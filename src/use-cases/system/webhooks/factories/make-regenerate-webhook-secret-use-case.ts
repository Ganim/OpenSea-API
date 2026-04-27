import { PrismaWebhookEndpointsRepository } from '@/repositories/system/prisma/prisma-webhook-endpoints-repository';
import { RegenerateWebhookSecretUseCase } from '../regenerate-webhook-secret';

export function makeRegenerateWebhookSecretUseCase() {
  return new RegenerateWebhookSecretUseCase(
    new PrismaWebhookEndpointsRepository(),
  );
}
