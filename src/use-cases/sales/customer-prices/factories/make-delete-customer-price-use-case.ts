import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { DeleteCustomerPriceUseCase } from '@/use-cases/sales/customer-prices/delete-customer-price';

export function makeDeleteCustomerPriceUseCase() {
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  return new DeleteCustomerPriceUseCase(customerPricesRepository);
}
