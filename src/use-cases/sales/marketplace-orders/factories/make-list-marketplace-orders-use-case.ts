import { PrismaMarketplaceOrdersRepository } from '@/repositories/sales/prisma/prisma-marketplace-orders-repository';
import { ListMarketplaceOrdersUseCase } from '../list-marketplace-orders';

export function makeListMarketplaceOrdersUseCase() {
  const repository = new PrismaMarketplaceOrdersRepository();
  return new ListMarketplaceOrdersUseCase(repository);
}
