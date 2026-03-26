import { PrismaPaymentLinksRepository } from '@/repositories/finance/prisma/prisma-payment-links-repository';
import { GetPaymentLinkPublicUseCase } from '../get-payment-link-public';

export function makeGetPaymentLinkPublicUseCase() {
  const paymentLinksRepository = new PrismaPaymentLinksRepository();

  return new GetPaymentLinkPublicUseCase(paymentLinksRepository);
}
