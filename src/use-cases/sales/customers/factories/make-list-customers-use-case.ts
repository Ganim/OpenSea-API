import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { ListCustomersUseCase } from '../list-customers';

export function makeListCustomersUseCase() {
  const customersRepository = new PrismaCustomersRepository();
  const listCustomersUseCase = new ListCustomersUseCase(customersRepository);
  return listCustomersUseCase;
}
