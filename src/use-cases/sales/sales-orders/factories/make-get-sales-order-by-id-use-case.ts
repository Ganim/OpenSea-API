import { PrismaSalesOrdersRepository } from '@/repositories/sales/prisma/prisma-sales-orders-repository';
import { GetSalesOrderByIdUseCase } from '../get-sales-order-by-id';

export function makeGetSalesOrderByIdUseCase() {
  const salesOrdersRepository = new PrismaSalesOrdersRepository();
  const getSalesOrderByIdUseCase = new GetSalesOrderByIdUseCase(
    salesOrdersRepository,
  );
  return getSalesOrderByIdUseCase;
}
