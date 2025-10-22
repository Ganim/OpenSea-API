import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { UpdateCustomerUseCase } from '../update-customer';

export function makeUpdateCustomerUseCase() {
  const customersRepository = new PrismaCustomersRepository();
  const updateCustomerUseCase = new UpdateCustomerUseCase(customersRepository);
  return updateCustomerUseCase;
}
