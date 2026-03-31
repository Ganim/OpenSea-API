import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { ListPaymentOrdersUseCase } from '../list-payment-orders';

export function makeListPaymentOrdersUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  return new ListPaymentOrdersUseCase(paymentOrdersRepository);
}
