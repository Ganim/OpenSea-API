import { PrismaMarketplaceOrdersRepository } from '@/repositories/sales/prisma/prisma-marketplace-orders-repository';
import { AcknowledgeMarketplaceOrderUseCase } from '../acknowledge-marketplace-order';

export function makeAcknowledgeMarketplaceOrderUseCase() {
  const repository = new PrismaMarketplaceOrdersRepository();
  return new AcknowledgeMarketplaceOrderUseCase(repository);
}
