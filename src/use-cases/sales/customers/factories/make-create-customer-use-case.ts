import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { CreateCustomerUseCase } from '../create-customer';

export function makeCreateCustomerUseCase() {
  const customersRepository = new PrismaCustomersRepository();
  const createCustomerUseCase = new CreateCustomerUseCase(customersRepository);
  return createCustomerUseCase;
}
