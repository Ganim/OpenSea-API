import { PrismaPaymentConditionsRepository } from '@/repositories/sales/prisma/prisma-payment-conditions-repository';
import { UpdatePaymentConditionUseCase } from '../update-payment-condition';

export function makeUpdatePaymentConditionUseCase() {
  return new UpdatePaymentConditionUseCase(
    new PrismaPaymentConditionsRepository(),
  );
}
