import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { SavePaymentConfigUseCase } from '../save-payment-config';

export function makeSavePaymentConfigUseCase() {
  return new SavePaymentConfigUseCase(new PrismaPaymentConfigsRepository());
}
