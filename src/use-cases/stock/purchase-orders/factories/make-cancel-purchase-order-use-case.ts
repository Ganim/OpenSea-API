import { PrismaPurchaseOrdersRepository } from '@/repositories/stock/prisma/prisma-purchase-orders-repository';
import { CancelPurchaseOrderUseCase } from '../cancel-purchase-order';

export function makeCancelPurchaseOrderUseCase() {
  const purchaseOrdersRepository = new PrismaPurchaseOrdersRepository();
  return new CancelPurchaseOrderUseCase(purchaseOrdersRepository);
}
