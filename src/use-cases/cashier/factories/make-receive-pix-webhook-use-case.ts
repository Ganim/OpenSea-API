import { PrismaPixChargesRepository } from '@/repositories/cashier/prisma/prisma-pix-charges-repository';
import { getPixProvider } from '@/services/cashier/pix-provider-factory';
import { ReceivePixWebhookUseCase } from '../receive-pix-webhook';

export function makeReceivePixWebhookUseCase() {
  const pixChargesRepository = new PrismaPixChargesRepository();
  const pixProvider = getPixProvider();

  return new ReceivePixWebhookUseCase(pixChargesRepository, pixProvider);
}
