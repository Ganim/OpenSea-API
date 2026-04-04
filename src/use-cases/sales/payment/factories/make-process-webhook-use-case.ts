import { PrismaPaymentChargesRepository } from '@/repositories/sales/prisma/prisma-payment-charges-repository';
import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { ProcessWebhookUseCase } from '../process-webhook';

export function makeProcessWebhookUseCase() {
  return new ProcessWebhookUseCase(
    new PrismaPaymentChargesRepository(),
    new PrismaPaymentConfigsRepository(),
  );
}
