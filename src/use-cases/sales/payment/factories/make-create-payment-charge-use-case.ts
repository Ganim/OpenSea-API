import { PrismaPaymentChargesRepository } from '@/repositories/sales/prisma/prisma-payment-charges-repository';
import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { CreatePaymentChargeUseCase } from '../create-payment-charge';

export function makeCreatePaymentChargeUseCase() {
  return new CreatePaymentChargeUseCase(
    new PrismaPaymentConfigsRepository(),
    new PrismaPaymentChargesRepository(),
  );
}
