import { PrismaPaymentLinksRepository } from '@/repositories/finance/prisma/prisma-payment-links-repository';
import { ListPaymentLinksUseCase } from '../list-payment-links';

export function makeListPaymentLinksUseCase() {
  const paymentLinksRepository = new PrismaPaymentLinksRepository();

  return new ListPaymentLinksUseCase(paymentLinksRepository);
}
