import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { UpdateCustomerPriceUseCase } from '@/use-cases/sales/customer-prices/update-customer-price';

export function makeUpdateCustomerPriceUseCase() {
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  return new UpdateCustomerPriceUseCase(customerPricesRepository);
}
