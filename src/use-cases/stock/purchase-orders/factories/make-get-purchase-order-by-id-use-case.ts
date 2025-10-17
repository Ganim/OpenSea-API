import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { GetPurchaseOrderByIdUseCase } from '../get-purchase-order-by-id';

export function makeGetPurchaseOrderByIdUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  return new GetPurchaseOrderByIdUseCase(purchaseOrdersRepository);
}
