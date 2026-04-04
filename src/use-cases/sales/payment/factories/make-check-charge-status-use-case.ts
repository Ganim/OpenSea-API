import { PrismaPaymentChargesRepository } from '@/repositories/sales/prisma/prisma-payment-charges-repository';
import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { CheckChargeStatusUseCase } from '../check-charge-status';

export function makeCheckChargeStatusUseCase() {
  return new CheckChargeStatusUseCase(
    new PrismaPaymentChargesRepository(),
    new PrismaPaymentConfigsRepository(),
  );
}
