import { PrismaMarketplacePaymentsRepository } from '@/repositories/sales/prisma/prisma-marketplace-payments-repository';
import { ListMarketplacePaymentsUseCase } from '../list-marketplace-payments';

export function makeListMarketplacePaymentsUseCase() {
  const repository = new PrismaMarketplacePaymentsRepository();
  return new ListMarketplacePaymentsUseCase(repository);
}
