import { PrismaPaymentConditionsRepository } from '@/repositories/sales/prisma/prisma-payment-conditions-repository';
import { ListPaymentConditionsUseCase } from '../list-payment-conditions';

export function makeListPaymentConditionsUseCase() {
  return new ListPaymentConditionsUseCase(
    new PrismaPaymentConditionsRepository(),
  );
}
