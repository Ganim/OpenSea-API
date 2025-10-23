import { PrismaSalesOrdersRepository } from '@/repositories/sales/prisma/prisma-sales-orders-repository';
import { ListSalesOrdersUseCase } from '../list-sales-orders';

export function makeListSalesOrdersUseCase() {
  const salesOrdersRepository = new PrismaSalesOrdersRepository();
  const listSalesOrdersUseCase = new ListSalesOrdersUseCase(
    salesOrdersRepository,
  );
  return listSalesOrdersUseCase;
}
