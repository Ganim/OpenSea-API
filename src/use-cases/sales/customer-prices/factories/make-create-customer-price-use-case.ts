import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { CreateCustomerPriceUseCase } from '@/use-cases/sales/customer-prices/create-customer-price';

export function makeCreateCustomerPriceUseCase() {
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  const customersRepository = new PrismaCustomersRepository();
  return new CreateCustomerPriceUseCase(
    customerPricesRepository,
    customersRepository,
  );
}
