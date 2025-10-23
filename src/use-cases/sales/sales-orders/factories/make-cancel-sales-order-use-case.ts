import { PrismaSalesOrdersRepository } from '@/repositories/sales/prisma/prisma-sales-orders-repository';
import { CancelSalesOrderUseCase } from '../cancel-sales-order';

export function makeCancelSalesOrderUseCase() {
  const salesOrdersRepository = new PrismaSalesOrdersRepository();
  const cancelSalesOrderUseCase = new CancelSalesOrderUseCase(
    salesOrdersRepository,
  );
  return cancelSalesOrderUseCase;
}
