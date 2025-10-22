import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { GetCustomerByIdUseCase } from '../get-customer-by-id';

export function makeGetCustomerByIdUseCase() {
  const customersRepository = new PrismaCustomersRepository();
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(
    customersRepository,
  );
  return getCustomerByIdUseCase;
}
