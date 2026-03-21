import { PrismaPaymentConditionsRepository } from '@/repositories/sales/prisma/prisma-payment-conditions-repository';
import { CreatePaymentConditionUseCase } from '../create-payment-condition';

export function makeCreatePaymentConditionUseCase() {
  return new CreatePaymentConditionUseCase(
    new PrismaPaymentConditionsRepository(),
  );
}
