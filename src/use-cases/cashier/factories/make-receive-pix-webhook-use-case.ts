import { PrismaPixChargesRepository } from '@/repositories/cashier/prisma/prisma-pix-charges-repository';
import { getPixProvider } from '@/services/cashier/pix-provider-factory';
import { makeAutoRegisterPixPaymentUseCase } from '@/use-cases/finance/entries/factories/make-auto-register-pix-payment-use-case';
import { ReceivePixWebhookUseCase } from '../receive-pix-webhook';

export function makeReceivePixWebhookUseCase() {
  const pixChargesRepository = new PrismaPixChargesRepository();
  const pixProvider = getPixProvider();
  const autoRegisterPixPaymentUseCase = makeAutoRegisterPixPaymentUseCase();

  return new ReceivePixWebhookUseCase(
    pixChargesRepository,
    pixProvider,
    autoRegisterPixPaymentUseCase,
  );
}
