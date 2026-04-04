import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { TestPaymentConnectionUseCase } from '../test-payment-connection';

export function makeTestPaymentConnectionUseCase() {
  return new TestPaymentConnectionUseCase(
    new PrismaPaymentConfigsRepository(),
  );
}
