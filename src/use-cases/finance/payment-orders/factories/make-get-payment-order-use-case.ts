import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { GetPaymentOrderUseCase } from '../get-payment-order';

export function makeGetPaymentOrderUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  return new GetPaymentOrderUseCase(paymentOrdersRepository);
}
