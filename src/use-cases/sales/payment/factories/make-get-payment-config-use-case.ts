import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { GetPaymentConfigUseCase } from '../get-payment-config';

export function makeGetPaymentConfigUseCase() {
  return new GetPaymentConfigUseCase(
    new PrismaPaymentConfigsRepository(),
  );
}
