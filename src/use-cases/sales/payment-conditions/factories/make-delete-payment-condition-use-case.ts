import { PrismaPaymentConditionsRepository } from '@/repositories/sales/prisma/prisma-payment-conditions-repository';
import { DeletePaymentConditionUseCase } from '../delete-payment-condition';

export function makeDeletePaymentConditionUseCase() {
  return new DeletePaymentConditionUseCase(
    new PrismaPaymentConditionsRepository(),
  );
}
