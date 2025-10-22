import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { DeleteCustomerUseCase } from '../delete-customer';

export function makeDeleteCustomerUseCase() {
  const customersRepository = new PrismaCustomersRepository();
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customersRepository);
  return deleteCustomerUseCase;
}
