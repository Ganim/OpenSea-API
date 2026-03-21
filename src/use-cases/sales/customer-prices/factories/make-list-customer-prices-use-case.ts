import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { ListCustomerPricesUseCase } from '@/use-cases/sales/customer-prices/list-customer-prices';

export function makeListCustomerPricesUseCase() {
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  return new ListCustomerPricesUseCase(customerPricesRepository);
}
