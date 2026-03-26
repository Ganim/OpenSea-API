import { PrismaPaymentLinksRepository } from '@/repositories/finance/prisma/prisma-payment-links-repository';
import { CreatePaymentLinkUseCase } from '../create-payment-link';

export function makeCreatePaymentLinkUseCase() {
  const paymentLinksRepository = new PrismaPaymentLinksRepository();

  return new CreatePaymentLinkUseCase(paymentLinksRepository);
}
