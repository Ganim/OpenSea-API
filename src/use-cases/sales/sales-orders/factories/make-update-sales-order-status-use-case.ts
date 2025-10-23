import { PrismaSalesOrdersRepository } from '@/repositories/sales/prisma/prisma-sales-orders-repository';
import { UpdateSalesOrderStatusUseCase } from '../update-sales-order-status';

export function makeUpdateSalesOrderStatusUseCase() {
  const salesOrdersRepository = new PrismaSalesOrdersRepository();
  const updateSalesOrderStatusUseCase = new UpdateSalesOrderStatusUseCase(
    salesOrdersRepository,
  );
  return updateSalesOrderStatusUseCase;
}
