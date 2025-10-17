import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { ListPurchaseOrdersUseCase } from '../list-purchase-orders';

export function makeListPurchaseOrdersUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  return new ListPurchaseOrdersUseCase(purchaseOrdersRepository);
}
