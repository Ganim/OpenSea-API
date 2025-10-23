import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaSalesOrdersRepository } from '@/repositories/sales/prisma/prisma-sales-orders-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { CreateSalesOrderUseCase } from '../create-sales-order';

export function makeCreateSalesOrderUseCase() {
  const salesOrdersRepository = new PrismaSalesOrdersRepository();
  const customersRepository = new PrismaCustomersRepository();
  const variantsRepository = new PrismaVariantsRepository();

  const createSalesOrderUseCase = new CreateSalesOrderUseCase(
    salesOrdersRepository,
    customersRepository,
    variantsRepository,
  );

  return createSalesOrderUseCase;
}
