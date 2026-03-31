import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { RejectPaymentOrderUseCase } from '../reject-payment-order';

export function makeRejectPaymentOrderUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  return new RejectPaymentOrderUseCase(paymentOrdersRepository);
}
